"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getSettings, setSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { runReminderRules } from "@/lib/notifications";
import { runDueJobs } from "@/lib/jobs";

export type SettingsState = { error?: string; success?: string };

const policySchema = z.object({
  completionThreshold: z.coerce.number().min(0).max(100),
  finalPassScore: z.coerce.number().min(0).max(100),
  responsibleAiMandatory: z.string().optional(),
  capstoneRequired: z.string().optional(),
  reviewIntervalDays: z.coerce.number().int().min(30).max(1095),
  sessionHours: z.coerce.number().int().min(1).max(168),
  maxFailedLogins: z.coerce.number().int().min(3).max(20),
  lockoutMinutes: z.coerce.number().int().min(1).max(1440),
  defaultLocale: z.enum(["en", "ar", "tr"]),
});

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requirePermission("settings.manage");
  const parsed = policySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;
  const before = await getSettings();

  await setSetting(SETTING_KEYS.COMPLETION_THRESHOLD, d.completionThreshold);
  await setSetting(SETTING_KEYS.FINAL_PASS_SCORE, d.finalPassScore);
  await setSetting(SETTING_KEYS.RESPONSIBLE_AI_MANDATORY, !!d.responsibleAiMandatory);
  await setSetting(SETTING_KEYS.CAPSTONE_REQUIRED, !!d.capstoneRequired);
  await setSetting(SETTING_KEYS.COURSE_REVIEW_DAYS, d.reviewIntervalDays);
  await setSetting(SETTING_KEYS.SESSION_HOURS, d.sessionHours);
  await setSetting(SETTING_KEYS.MAX_FAILED_LOGINS, d.maxFailedLogins);
  await setSetting(SETTING_KEYS.LOCKOUT_MINUTES, d.lockoutMinutes);
  await setSetting(SETTING_KEYS.DEFAULT_LOCALE, d.defaultLocale);

  const readiness = {
    assessment: Number(formData.get("readiness.assessment") ?? 30),
    training: Number(formData.get("readiness.training") ?? 20),
    improvement: Number(formData.get("readiness.improvement") ?? 25),
    responsibleAi: Number(formData.get("readiness.responsibleAi") ?? 15),
    application: Number(formData.get("readiness.application") ?? 10),
  };
  if (Object.values(readiness).some((v) => !Number.isFinite(v) || v < 0 || v > 100)) {
    return { error: "errors.validation" };
  }
  await setSetting(SETTING_KEYS.READINESS_WEIGHTS, readiness);

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "SETTINGS_CHANGE",
    entity: "SystemSetting",
    before,
    after: { ...d, readiness },
  });

  revalidatePath("/admin/settings");
  return { success: "common.saved" };
}

const aiSchema = z.object({
  enabled: z.string().optional(),
  provider: z.string().trim().min(2).max(40),
  model: z.string().trim().min(2).max(80),
  baseUrl: z.string().trim().url().or(z.literal("")).optional(),
  maxTokens: z.coerce.number().int().min(128).max(8192),
});

export async function saveAiIntegrationAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requirePermission("integrations.manage");
  const parsed = aiSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  // Merged into what is there, never replaced: the model roles and prices set
  // on /admin/ai live on the same row, and saving this form used to wipe them —
  // routing every task to the default model and every cost to "unknown".
  const current = await prisma.integration.findUnique({ where: { key: "ai" } });
  const config = {
    ...parseJson<Record<string, unknown>>(current?.config ?? null, {}),
    provider: d.provider,
    model: d.model,
    baseUrl: d.baseUrl || undefined,
    maxTokens: d.maxTokens,
  };
  await prisma.integration.upsert({
    where: { key: "ai" },
    update: { config: JSON.stringify(config), enabled: !!d.enabled },
    create: { key: "ai", name: "AI provider", type: "AI_PROVIDER", config: JSON.stringify(config), enabled: !!d.enabled },
  });
  await setSetting(SETTING_KEYS.AI_ENABLED, !!d.enabled);
  await setSetting(SETTING_KEYS.AI_PROVIDER, d.provider);
  await setSetting(SETTING_KEYS.AI_MODEL, d.model);

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "INTEGRATION_CHANGE",
    entity: "Integration",
    entityId: "ai",
    after: { ...config, enabled: !!d.enabled },
  });

  revalidatePath("/admin/settings");
  return {
    success: d.enabled
      ? "form.aiSavedKeyNeeded"
      : "common.saved",
  };
}

const smtpSchema = z.object({
  enabled: z.string().optional(),
  host: z.string().trim().max(200),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().trim().max(200),
  from: z.string().trim().max(200),
});

export async function saveSmtpAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requirePermission("integrations.manage");
  const parsed = smtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const config = { host: d.host, port: d.port, user: d.user, from: d.from };
  await prisma.integration.upsert({
    where: { key: "smtp" },
    update: { config: JSON.stringify(config), enabled: !!d.enabled },
    create: { key: "smtp", name: "SMTP email", type: "SMTP", config: JSON.stringify(config), enabled: !!d.enabled },
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "INTEGRATION_CHANGE",
    entity: "Integration",
    entityId: "smtp",
    after: config,
  });

  revalidatePath("/admin/settings");
  return { success: "form.smtpSaved" };
}

export async function toggleReminderAction(id: string, enabled: boolean) {
  const admin = await requirePermission("settings.manage");
  await prisma.reminderRule.update({ where: { id }, data: { enabled } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "REMINDER_RULE_CHANGE",
    entity: "ReminderRule",
    entityId: id,
    after: { enabled },
  });
  revalidatePath("/admin/settings");
}

export async function runRemindersAction(): Promise<SettingsState> {
  const admin = await requirePermission("settings.manage");
  const { sent } = await runReminderRules();
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "REMINDERS_RUN",
    entity: "ReminderRule",
    summary: `${sent} notifications`,
  });
  return { success: `form.remindersSent:${sent}` };
}

/**
 * Runs every scheduled job now, regardless of when it last ran.
 *
 * The jobs run on a timer inside the app; this is for the case where an
 * administrator has just changed a reminder rule and wants to see it take
 * effect without waiting for the next tick.
 */
export async function runJobsAction(): Promise<string> {
  const admin = await requirePermission("settings.manage");
  const outcomes = await runDueJobs({ force: true });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "JOBS_RUN_MANUALLY",
    entity: "Job",
    summary: outcomes.map((o) => `${o.key}: ${o.detail}`).join("; ").slice(0, 500),
  });

  return outcomes.map((o) => `${o.key} — ${o.detail}`).join(" · ");
}
