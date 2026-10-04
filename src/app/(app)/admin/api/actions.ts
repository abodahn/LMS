"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { newApiKey } from "@/lib/api-keys";
import { acceptableUrl, newWebhookSecret, WEBHOOK_EVENTS } from "@/lib/webhooks";

/** `secret` carries a key or signing secret back exactly once, to be copied. */
export type ApiAdminState = { error?: string; success?: string; secret?: string };

const PERMISSION = "integrations.manage";

export async function createApiKeyAction(_prev: ApiAdminState, form: FormData): Promise<ApiAdminState> {
  const admin = await requirePermission(PERMISSION);
  const name = z.string().trim().min(2).max(80).safeParse(form.get("name"));
  if (!name.success) return { error: "errors.validation" };

  const key = newApiKey();
  const row = await prisma.apiKey.create({
    data: { name: name.data, prefix: key.prefix, keyHash: key.keyHash, createdById: admin.id },
  });
  await audit({ actorId: admin.id, actorName: admin.fullName, action: "API_KEY_CREATED", entity: "ApiKey", entityId: row.id, summary: `${name.data} (${key.prefix}…)` });
  revalidatePath("/admin/api");
  return { success: "api.keyCreated", secret: key.raw };
}

export async function revokeApiKeyAction(_prev: ApiAdminState, form: FormData): Promise<ApiAdminState> {
  const admin = await requirePermission(PERMISSION);
  const id = String(form.get("id") ?? "");
  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key || key.revokedAt) return { error: "errors.validation" };
  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit({ actorId: admin.id, actorName: admin.fullName, action: "API_KEY_REVOKED", entity: "ApiKey", entityId: id, summary: `${key.name} (${key.prefix}…)` });
  revalidatePath("/admin/api");
  return { success: "api.keyRevoked" };
}

export async function createWebhookAction(_prev: ApiAdminState, form: FormData): Promise<ApiAdminState> {
  const admin = await requirePermission(PERMISSION);
  const url = String(form.get("url") ?? "").trim();
  const events = form.getAll("events").map(String).filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (!acceptableUrl(url) || url.length > 500) return { error: "api.badUrl" };
  if (!events.length) return { error: "api.noEvents" };

  const secret = newWebhookSecret();
  const row = await prisma.webhook.create({ data: { url, secret, events: events.join(","), createdById: admin.id } });
  await audit({ actorId: admin.id, actorName: admin.fullName, action: "WEBHOOK_CREATED", entity: "Webhook", entityId: row.id, summary: `${new URL(url).host}: ${events.join(", ")}` });
  revalidatePath("/admin/api");
  return { success: "api.webhookCreated", secret };
}

export async function toggleWebhookAction(_prev: ApiAdminState, form: FormData): Promise<ApiAdminState> {
  const admin = await requirePermission(PERMISSION);
  const id = String(form.get("id") ?? "");
  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook) return { error: "errors.validation" };
  await prisma.webhook.update({ where: { id }, data: { isActive: !hook.isActive } });
  await audit({ actorId: admin.id, actorName: admin.fullName, action: hook.isActive ? "WEBHOOK_PAUSED" : "WEBHOOK_RESUMED", entity: "Webhook", entityId: id, summary: new URL(hook.url).host });
  revalidatePath("/admin/api");
  return { success: "common.saved" };
}

export async function deleteWebhookAction(_prev: ApiAdminState, form: FormData): Promise<ApiAdminState> {
  const admin = await requirePermission(PERMISSION);
  const id = String(form.get("id") ?? "");
  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook) return { error: "errors.validation" };
  await prisma.webhook.delete({ where: { id } });
  await audit({ actorId: admin.id, actorName: admin.fullName, action: "WEBHOOK_REMOVED", entity: "Webhook", entityId: id, summary: new URL(hook.url).host });
  revalidatePath("/admin/api");
  return { success: "common.saved" };
}
