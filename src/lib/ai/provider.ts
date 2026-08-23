import "server-only";
import { prisma } from "../db";
import { getSettings } from "../settings";
import { SETTING_KEYS } from "../constants";
import { parseJson } from "../utils";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiConfig = {
  enabled: boolean;
  provider: string; // anthropic | openai | openrouter | compatible
  model: string;
  baseUrl?: string;
  maxTokens: number;
};

export class AiDisabledError extends Error {
  constructor() {
    super("AI provider is not configured");
  }
}

/**
 * API keys are read from the environment only — never stored in the database
 * and never sent to the browser. Admin → Integrations stores the non-secret
 * parts (provider, model, base URL).
 */
function apiKeyFor(provider: string): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    default:
      return process.env.AI_API_KEY;
  }
}

export async function getAiConfig(): Promise<AiConfig> {
  const [settings, integration] = await Promise.all([
    getSettings(),
    prisma.integration.findUnique({ where: { key: "ai" } }).catch(() => null),
  ]);
  const cfg = parseJson<{ provider?: string; model?: string; baseUrl?: string; maxTokens?: number }>(
    integration?.config ?? null,
    {},
  );
  const provider = cfg.provider ?? String(settings[SETTING_KEYS.AI_PROVIDER] ?? "anthropic");
  const enabled =
    Boolean(settings[SETTING_KEYS.AI_ENABLED]) && Boolean(integration?.enabled ?? true) && !!apiKeyFor(provider);

  return {
    enabled,
    provider,
    model: cfg.model ?? String(settings[SETTING_KEYS.AI_MODEL] ?? "claude-sonnet-5"),
    baseUrl: cfg.baseUrl,
    maxTokens: cfg.maxTokens ?? 1024,
  };
}

export async function aiAvailable() {
  return (await getAiConfig()).enabled;
}

/**
 * One call, three wire formats. Kept deliberately small — the platform uses AI
 * only to explain and illustrate; scores, levels and recommendations are
 * computed deterministically elsewhere.
 */
export async function chat(system: string, messages: ChatMessage[]): Promise<string> {
  const cfg = await getAiConfig();
  if (!cfg.enabled) throw new AiDisabledError();
  const key = apiKeyFor(cfg.provider);
  if (!key) throw new AiDisabledError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    if (cfg.provider === "anthropic") {
      const res = await fetch(`${cfg.baseUrl ?? "https://api.anthropic.com"}/v1/messages`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: cfg.model, max_tokens: cfg.maxTokens, system, messages }),
      });
      if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
      const json = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
    }

    // OpenAI, OpenRouter and any OpenAI-compatible endpoint share this shape.
    const base =
      cfg.baseUrl ??
      (cfg.provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? "";
  } finally {
    clearTimeout(timeout);
  }
}
