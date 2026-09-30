import "server-only";
import { prisma } from "../db";
import { getSettings } from "../settings";
import { SETTING_KEYS } from "../constants";
import { parseJson } from "../utils";
import { alertOnThresholds, assertWithinBudget } from "./budget";
import { mockReply, type ProviderReply } from "./mock";
import { modelFor, type AiFeature, type ModelPrice, type ModelRole } from "./provider-shared";

export { AI_FEATURES, MODEL_ROLES, costOf, modelFor, type AiFeature, type ModelPrice, type ModelRole } from "./provider-shared";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiConfig = {
  enabled: boolean;
  provider: string; // anthropic | openai | openrouter | compatible | mock
  model: string;
  models: Partial<Record<ModelRole, string>>;
  prices: Record<string, ModelPrice>;
  baseUrl?: string;
  maxTokens: number;
};

export class AiDisabledError extends Error {
  constructor() {
    super("AI provider is not configured");
  }
}

/** The reply hit its length limit before it finished. */
export class AiTruncatedError extends Error {
  constructor() {
    super("AI reply was cut off at its length limit");
  }
}

/** The provider answered with something a feature could not use. */
export class AiBadOutputError extends Error {
  constructor() {
    super("AI provider returned output that could not be used");
  }
}

/**
 * API keys are read from the environment only — never stored in the database
 * and never sent to the browser. Admin → Integrations stores the non-secret
 * parts (provider, models, base URL, prices).
 */
function apiKeyFor(provider: string): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    case "mock":
      // See mock.ts: unreachable in production by construction.
      return process.env.NODE_ENV === "production" ? undefined : "mock";
    default:
      return process.env.AI_API_KEY;
  }
}

export async function getAiConfig(): Promise<AiConfig> {
  const [settings, integration] = await Promise.all([
    getSettings(),
    prisma.integration.findUnique({ where: { key: "ai" } }).catch(() => null),
  ]);
  const cfg = parseJson<{
    provider?: string;
    model?: string;
    models?: Partial<Record<ModelRole, string>>;
    prices?: Record<string, ModelPrice>;
    baseUrl?: string;
    maxTokens?: number;
  }>(integration?.config ?? null, {});
  const provider = cfg.provider ?? String(settings[SETTING_KEYS.AI_PROVIDER] ?? "anthropic");
  const enabled =
    Boolean(settings[SETTING_KEYS.AI_ENABLED]) && Boolean(integration?.enabled ?? true) && !!apiKeyFor(provider);

  return {
    enabled,
    provider,
    model: cfg.model ?? String(settings[SETTING_KEYS.AI_MODEL] ?? "claude-sonnet-5"),
    models: cfg.models ?? {},
    prices: cfg.prices ?? {},
    baseUrl: cfg.baseUrl,
    maxTokens: cfg.maxTokens ?? 1024,
  };
}

export async function aiAvailable() {
  return (await getAiConfig()).enabled;
}

class ProviderStatusError extends Error {
  constructor(public readonly status: number) {
    super(`AI provider returned ${status}`);
  }
}

async function callProvider(
  cfg: AiConfig,
  model: string,
  feature: AiFeature,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<ProviderReply> {
  if (cfg.provider === "mock") {
    return mockReply(feature, system, messages.map((m) => m.content).join("\n"));
  }
  const key = apiKeyFor(cfg.provider);
  if (!key) throw new AiDisabledError();

  // Long replies take long: a non-streamed request for 8,000 tokens of lesson
  // text runs for minutes, and a fixed one-minute abort failed every real
  // course draft — after the provider had already started billing for it.
  // About 40ms a token, never under a minute, never over ten.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(600_000, Math.max(60_000, maxTokens * 40)));
  try {
    if (cfg.provider === "anthropic") {
      const res = await fetch(`${cfg.baseUrl ?? "https://api.anthropic.com"}/v1/messages`, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
      });
      if (!res.ok) throw new ProviderStatusError(res.status);
      const json = (await res.json()) as {
        content?: { type: string; text?: string }[];
        stop_reason?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      return {
        text: (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim(),
        inputTokens: json.usage?.input_tokens ?? 0,
        outputTokens: json.usage?.output_tokens ?? 0,
        truncated: json.stop_reason === "max_tokens",
      };
    }

    // OpenAI, OpenRouter and any OpenAI-compatible endpoint share this shape.
    const base =
      cfg.baseUrl ?? (cfg.provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] }),
    });
    if (!res.ok) throw new ProviderStatusError(res.status);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      text: json.choices?.[0]?.message?.content?.trim() ?? "",
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
      truncated: json.choices?.[0]?.finish_reason === "length",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** A short, loggable reason — never a provider response body. */
function errorCode(e: unknown): string {
  if (e instanceof ProviderStatusError) return `HTTP_${e.status}`;
  if (e instanceof Error && e.name === "AbortError") return "TIMEOUT";
  return "ERROR";
}

export type ChatOptions = {
  feature: AiFeature;
  role?: ModelRole;
  userId?: string | null;
  maxTokens?: number;
  /**
   * Hand back a reply that hit its length cap instead of failing. Right for
   * conversation, where the start of a long answer is still an answer; wrong
   * for anything a parser has to read whole.
   */
  acceptTruncated?: boolean;
};

/**
 * One metered call.
 *
 * Every call is checked against the budgets first and recorded afterwards,
 * whether it worked or not. If the model for the requested role fails and a
 * fallback model is configured, the call is retried once on the fallback —
 * both attempts are recorded, because both were billed.
 *
 * The platform uses AI only to explain, illustrate and draft. Scores, levels,
 * recommendations and anything published are decided deterministically or by a
 * person elsewhere.
 */
export async function chat(system: string, messages: ChatMessage[], opts: ChatOptions): Promise<string> {
  const cfg = await getAiConfig();
  if (!cfg.enabled) throw new AiDisabledError();

  const user = opts.userId
    ? await prisma.user.findUnique({ where: { id: opts.userId }, select: { departmentId: true } })
    : null;
  const departmentId = user?.departmentId ?? null;

  await assertWithinBudget(departmentId);

  const role = opts.role ?? "FAST";
  const maxTokens = opts.maxTokens ?? cfg.maxTokens;
  const attempts: { role: ModelRole; model: string }[] = [{ role, model: modelFor(cfg, role) }];
  const fallback = cfg.models.FALLBACK?.trim();
  if (fallback && fallback !== attempts[0].model) attempts.push({ role: "FALLBACK", model: fallback });

  let lastError: unknown;
  for (const attempt of attempts) {
    const meter = (data: { ok: boolean; inputTokens?: number; outputTokens?: number; errorCode?: string }) =>
      prisma.aiUsage
        .create({
          data: {
            userId: opts.userId ?? null,
            departmentId,
            feature: opts.feature,
            role: attempt.role,
            provider: cfg.provider,
            model: attempt.model,
            ...data,
          },
        })
        // A metering failure is logged, never rethrown: rethrowing it here
        // used to land in the retry path and send a second, billed request
        // for an answer already paid for.
        .catch((e) => console.error("[ai] usage write failed:", e instanceof Error ? e.message : e));

    let reply: ProviderReply;
    try {
      reply = await callProvider(cfg, attempt.model, opts.feature, system, messages, maxTokens);
    } catch (e) {
      lastError = e;
      const code = errorCode(e);
      await meter({ ok: false, errorCode: code });
      // A timeout is slowness, and the fallback would be slow on the same
      // request too — retrying pays for it twice and fails twice.
      if (code === "TIMEOUT") break;
      continue;
    }

    await meter({
      ok: !reply.truncated,
      inputTokens: reply.inputTokens,
      outputTokens: reply.outputTokens,
      ...(reply.truncated ? { errorCode: "TRUNCATED" } : {}),
    });
    // Alerts are a side effect: a failure to send one must not lose the answer
    // the caller already paid for.
    await alertOnThresholds(departmentId).catch((e) =>
      console.error("[ai] budget alert failed:", e instanceof Error ? e.message : e),
    );
    // Cut off at the length cap: billed in full, and not something a parser
    // should be asked to make sense of. Not retried — the fallback has the
    // same cap and would stop in the same place.
    if (reply.truncated && !opts.acceptTruncated) throw new AiTruncatedError();
    return reply.text;
  }
  throw lastError;
}

/**
 * A call whose answer must be JSON, validated by the caller's parser.
 *
 * Models wrap JSON in prose or code fences often enough that the first
 * object in the reply is taken rather than the whole text. Anything that still
 * fails the parser is refused, not repaired: a half-understood course outline
 * is worse than none.
 */
export async function chatJson<T>(
  system: string,
  prompt: string,
  opts: ChatOptions,
  parse: (value: unknown) => T,
): Promise<T> {
  const text = await chat(`${system}\n\nReply with a single JSON object and nothing else.`, [{ role: "user", content: prompt }], opts);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new AiBadOutputError();
  try {
    return parse(JSON.parse(text.slice(start, end + 1)));
  } catch {
    throw new AiBadOutputError();
  }
}
