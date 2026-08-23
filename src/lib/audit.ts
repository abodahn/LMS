// No `server-only`: the scheduled job runner writes audit entries too, which is
// why the request-metadata lookup below is already guarded.
import { headers } from "next/headers";
import { prisma } from "./db";

export type AuditInput = {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary?: string;
  before?: unknown;
  after?: unknown;
};

/** Values that must never reach the audit trail even if a caller passes them. */
const REDACT = /^(passwordHash|password|token|tokenHash|apiKey|secret)$/i;

function scrub(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT.test(k) ? "[redacted]" : scrub(v);
  }
  return out;
}

export async function audit(input: AuditInput) {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    userAgent = h.get("user-agent")?.slice(0, 400) ?? null;
  } catch {
    // outside a request (seed / cron) — no request metadata to record
  }
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      summary: input.summary,
      before: input.before === undefined ? null : JSON.stringify(scrub(input.before)),
      after: input.after === undefined ? null : JSON.stringify(scrub(input.after)),
      ip,
      userAgent,
    },
  });
}
