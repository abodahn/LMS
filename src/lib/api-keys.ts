import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { rateLimit } from "./rate-limit";

/**
 * Keys for the read-only API (/api/v1). Only a SHA-256 of each key is kept;
 * the key itself is shown once, when it is created, and cannot be recovered.
 * A key reads; nothing under /api/v1 writes.
 */

const hash = (v: string) => createHash("sha256").update(v).digest("hex");

export function newApiKey() {
  const raw = `tca_${randomBytes(24).toString("base64url")}`;
  return { raw, prefix: raw.slice(0, 12), keyHash: hash(raw) };
}

const PER_MINUTE = 120;

/** The key's id, or the response to send instead. */
export async function apiAuth(request: Request): Promise<{ keyId: string } | NextResponse> {
  const raw = request.headers.get("authorization")?.match(/^Bearer\s+(tca_[A-Za-z0-9_-]+)$/)?.[1];
  const key = raw ? await prisma.apiKey.findUnique({ where: { keyHash: hash(raw) } }) : null;
  if (!key || key.revokedAt) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!rateLimit(`api:${key.id}`, PER_MINUTE, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "retry-after": "60" } });
  }
  if (!key.lastUsedAt || Date.now() - key.lastUsedAt.getTime() > 60_000) {
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  }
  return { keyId: key.id };
}

/** `limit`, `cursor` and `since` from the query string, bounded. */
export function page(request: Request) {
  const q = new URL(request.url).searchParams;
  const limit = Math.min(500, Math.max(1, Number(q.get("limit")) || 100));
  const since = q.get("since") ? new Date(q.get("since")!) : null;
  return {
    limit,
    cursor: q.get("cursor") || null,
    since: since && !Number.isNaN(since.getTime()) ? since : null,
  };
}

/** Cursor pagination by id: ask for one extra row to know whether there is more. */
export function paged<T extends { id: string }>(rows: T[], limit: number) {
  const more = rows.length > limit;
  const data = more ? rows.slice(0, limit) : rows;
  return { data, nextCursor: more ? data[data.length - 1].id : null };
}
