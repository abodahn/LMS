"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseJson } from "@/lib/utils";
import { COMPANY_KEY, departmentKey } from "@/lib/ai/budget";
import { MODEL_ROLES } from "@/lib/ai/provider-shared";

export type AiAdminState = { error?: string; success?: string };

const budgetSchema = z.object({
  scope: z.string().min(1), // "COMPANY" or a department id
  monthlyTokens: z.coerce.number().int().min(1000).max(10_000_000_000),
  hardStop: z.enum(["yes", "no"]),
});

/** Sets one allowance. The number is the administrator's; nothing is defaulted. */
export async function saveBudgetAction(_prev: AiAdminState, formData: FormData): Promise<AiAdminState> {
  const admin = await requirePermission("integrations.manage");
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const isCompany = d.scope === COMPANY_KEY;
  if (!isCompany && !(await prisma.department.findUnique({ where: { id: d.scope } }))) {
    return { error: "errors.validation" };
  }
  const key = isCompany ? COMPANY_KEY : departmentKey(d.scope);
  // A new limit gets its own alerts: the flags record that this month's 80%
  // and 100% were announced for the old number, which says nothing about the
  // new one.
  const data = {
    monthlyTokens: d.monthlyTokens,
    hardStop: d.hardStop === "yes",
    departmentId: isCompany ? null : d.scope,
    alerted80: null,
    alerted100: null,
  };

  await prisma.aiBudget.upsert({ where: { key }, update: data, create: { key, ...data } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "AI_BUDGET_SET",
    entity: "AiBudget",
    entityId: key,
    summary: `${d.monthlyTokens.toLocaleString("en")} tokens/month${d.hardStop === "yes" ? ", hard stop" : ""}`,
  });
  revalidatePath("/admin/ai");
  return { success: "common.saved" };
}

export async function deleteBudgetAction(_prev: AiAdminState, formData: FormData): Promise<AiAdminState> {
  const admin = await requirePermission("integrations.manage");
  const key = String(formData.get("key") ?? "");
  const existing = await prisma.aiBudget.findUnique({ where: { key } });
  if (!existing) return { error: "errors.validation" };
  await prisma.aiBudget.delete({ where: { key } });
  await audit({ actorId: admin.id, actorName: admin.fullName, action: "AI_BUDGET_REMOVED", entity: "AiBudget", entityId: key });
  revalidatePath("/admin/ai");
  return { success: "common.saved" };
}

const priceLine = /^\s*([^=\s][^=]*?)\s*=\s*([0-9]*\.?[0-9]+)\s*\/\s*([0-9]*\.?[0-9]+)\s*$/;

/**
 * Model roles and prices, merged into the existing AI integration config.
 *
 * Merged, never replaced: the provider, default model and base URL on the same
 * row are set from Settings, and saving this form must not wipe them.
 *
 * Prices are one per line, "model = input / output" per million tokens. A line
 * that does not parse fails the whole save rather than being skipped, because a
 * price that silently vanished would make the cost report quietly wrong.
 */
export async function saveModelsAction(_prev: AiAdminState, formData: FormData): Promise<AiAdminState> {
  const admin = await requirePermission("integrations.manage");

  const models: Record<string, string> = {};
  for (const role of MODEL_ROLES) {
    const value = String(formData.get(`model_${role}`) ?? "").trim();
    if (value.length > 120) return { error: "errors.validation" };
    if (value) models[role] = value;
  }

  const prices: Record<string, { input: number; output: number }> = {};
  const lines = String(formData.get("prices") ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = priceLine.exec(line);
    if (!m) return { error: "ai.badPriceLine" };
    prices[m[1]] = { input: Number(m[2]), output: Number(m[3]) };
  }

  const row = await prisma.integration.findUnique({ where: { key: "ai" } });
  const config = { ...parseJson<Record<string, unknown>>(row?.config ?? null, {}), models, prices };
  await prisma.integration.upsert({
    where: { key: "ai" },
    update: { config: JSON.stringify(config) },
    create: { key: "ai", name: "AI provider", type: "AI_PROVIDER", config: JSON.stringify(config), enabled: false },
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "AI_MODELS_SET",
    entity: "Integration",
    entityId: "ai",
    summary: `${Object.keys(models).length} role(s), ${Object.keys(prices).length} price(s)`,
  });
  revalidatePath("/admin/ai");
  return { success: "common.saved" };
}
