import { createHmac, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { prisma } from "./db";

/**
 * Outbound webhooks: the academy telling another system that something
 * happened, instead of that system polling for it.
 *
 * Every delivery is written down first (an outbox), then sent; a failure is
 * retried by the scheduler with growing gaps, and given up on after
 * MAX_ATTEMPTS. Receivers verify the signature and should de-duplicate on the
 * delivery id, because at-least-once is the honest promise of any webhook.
 *
 * Signature: header `x-academy-signature: t=<unix seconds>,v1=<hex>` where hex
 * is HMAC-SHA256(secret, `${t}.${raw body}`). The secret is stored because
 * signing needs it; it is shown to the administrator once, at creation.
 */

export const WEBHOOK_EVENTS = ["course.completed", "certificate.issued"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const MAX_ATTEMPTS = 6;

/**
 * Addresses a webhook may never reach: this machine, the private networks the
 * host sits on, link-local (where cloud metadata services live) and the other
 * special-purpose ranges. Checked on every send, against what the name
 * resolves to then, so a name re-pointed after it was saved is caught too.
 */
const PRIVATE = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) PRIVATE.addSubnet(net, bits, "ipv4");
for (const [net, bits] of [["::", 127], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96]] as const) {
  PRIVATE.addSubnet(net, bits, "ipv6");
}

export function isPublicAddress(ip: string) {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)?.[1];
  if (mapped) return isPublicAddress(mapped);
  const family = isIP(ip);
  if (!family) return false;
  return !PRIVATE.check(ip, family === 4 ? "ipv4" : "ipv6");
}

async function publicTarget(url: string) {
  // Local receivers are how a developer tests this; production never allows them.
  if (process.env.NODE_ENV !== "production") return true;
  const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  return addresses.length > 0 && addresses.every((a) => isPublicAddress(a.address));
}

export function newWebhookSecret() {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signature(secret: string, body: string, t: number) {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}

/** Minutes to wait after the nth failed attempt: 2, 4, 8, 16, 32. */
export function backoffMinutes(attempts: number) {
  return 2 ** attempts;
}

/**
 * Records a delivery for every active subscriber and starts sending. Never
 * throws: the course was completed whether or not a receiver heard about it.
 */
export async function emit(event: WebhookEvent, data: Record<string, unknown>) {
  try {
    const hooks = await prisma.webhook.findMany({ where: { isActive: true }, select: { id: true, events: true } });
    const subscribed = hooks.filter((h) => h.events.split(",").includes(event));
    if (!subscribed.length) return;
    const payload = JSON.stringify({ event, occurredAt: new Date().toISOString(), data });
    const rows = await prisma.$transaction(
      subscribed.map((h) => prisma.webhookDelivery.create({ data: { webhookId: h.id, event, payload }, select: { id: true } })),
    );
    void Promise.allSettled(rows.map((r) => deliver(r.id)));
  } catch (error) {
    console.error("webhook emit failed", error instanceof Error ? error.message : "unknown");
  }
}

export async function deliver(id: string) {
  // Claim it first, so the immediate send and a scheduler tick cannot both
  // send the same delivery: whoever moves nextAttemptAt owns this attempt.
  const now = new Date();
  const claimed = await prisma.webhookDelivery.updateMany({
    where: { id, status: "PENDING", nextAttemptAt: { lte: now } },
    data: { nextAttemptAt: new Date(now.getTime() + 5 * 60_000) },
  });
  if (claimed.count !== 1) return;

  const d = await prisma.webhookDelivery.findUnique({ where: { id }, include: { webhook: true } });
  // A paused webhook keeps its queue; the deliveries go when it is resumed.
  if (!d || !d.webhook.isActive) return;
  const t = Math.floor(Date.now() / 1000);
  try {
    if (!(await publicTarget(d.webhook.url))) throw new Error("address not allowed (private or local network)");
    const res = await fetch(d.webhook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "TC-AI-Academy-Webhooks/1",
        "x-academy-event": d.event,
        "x-academy-delivery": d.id,
        "x-academy-signature": signature(d.webhook.secret, d.payload, t),
      },
      body: d.payload,
      // A redirect would send the signed payload somewhere nobody configured.
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await prisma.webhookDelivery.update({
      where: { id },
      data: { status: "DELIVERED", attempts: { increment: 1 }, deliveredAt: new Date(), lastError: null },
    });
  } catch (error) {
    const attempts = d.attempts + 1;
    await prisma.webhookDelivery.update({
      where: { id },
      data: {
        attempts,
        status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
        nextAttemptAt: new Date(Date.now() + backoffMinutes(attempts) * 60_000),
        lastError: (error instanceof Error ? error.message : "unknown").slice(0, 200),
      },
    });
  }
}

/** The scheduler's part: everything due, oldest first. */
export async function retryDueDeliveries() {
  const due = await prisma.webhookDelivery.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() }, webhook: { isActive: true } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true },
  });
  for (const d of due) await deliver(d.id);
  return due.length;
}

/**
 * `course.completed`, from whichever route completed it. Callers fire this on
 * the transition to COMPLETED only, so a learner revisiting a finished course
 * does not announce it again.
 */
export async function courseCompleted(enrollmentId: string) {
  const e = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      completedAt: true,
      user: { select: { id: true, employeeCode: true, email: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });
  if (!e) return;
  await emit("course.completed", {
    enrollmentId,
    completedAt: e.completedAt?.toISOString() ?? null,
    employee: e.user,
    course: e.course,
  });
}

/** A URL a webhook may point at: https, or http to this machine while developing. */
export function acceptableUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol === "https:") return true;
    return process.env.NODE_ENV !== "production" && u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname);
  } catch {
    return false;
  }
}
