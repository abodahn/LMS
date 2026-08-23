"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { setSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { enrollFromRecommendations, generateRecommendations } from "@/lib/recommendation/service";
import { notify } from "@/lib/notifications";

export type EngineState = { error?: string; success?: string };

export async function saveWeightsAction(_prev: EngineState, formData: FormData): Promise<EngineState> {
  const user = await requirePermission("recommendation.manage");
  const before = await prisma.recommendationWeight.findMany();

  for (const row of before) {
    const raw = formData.get(`weight.${row.key}`);
    if (raw == null) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100) return { error: "errors.validation" };
    await prisma.recommendationWeight.update({ where: { key: row.key }, data: { weight: value } });
  }

  const hours = z
    .object({
      target: z.coerce.number().min(1).max(200),
      min: z.coerce.number().min(1).max(200),
      max: z.coerce.number().min(1).max(300),
    })
    .safeParse({
      target: formData.get("targetHours"),
      min: formData.get("minHours"),
      max: formData.get("maxHours"),
    });

  if (!hours.success || hours.data.min > hours.data.target || hours.data.target > hours.data.max) {
    return { error: "errors.validation" };
  }

  await setSetting(SETTING_KEYS.TARGET_LEARNING_HOURS, hours.data.target);
  await setSetting(SETTING_KEYS.MIN_LEARNING_HOURS, hours.data.min);
  await setSetting(SETTING_KEYS.MAX_LEARNING_HOURS, hours.data.max);

  const after = await prisma.recommendationWeight.findMany();
  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "RECOMMENDATION_WEIGHTS_CHANGE",
    entity: "RecommendationWeight",
    before: before.map((b) => ({ key: b.key, weight: b.weight })),
    after: after.map((a) => ({ key: a.key, weight: a.weight })),
  });

  revalidatePath("/admin/recommendation");
  return { success: "common.saved" };
}

/** Turns the previewed path into real enrolments for that employee. */
export async function applyRecommendationAction(userId: string): Promise<EngineState> {
  const admin = await requirePermission("recommendation.manage");
  if (!userId) return { error: "errors.validation" };

  const { runId } = await generateRecommendations(userId);
  const { enrolled } = await enrollFromRecommendations(userId, runId);

  await notify(userId, {
    category: "LEARNING",
    title: "Your learning path has been updated",
    body: "Your L&D team has set up a learning path for you.",
    link: "/learning",
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "RECOMMENDATION_APPLIED",
    entity: "User",
    entityId: userId,
    summary: `${enrolled} courses enrolled`,
  });

  revalidatePath("/admin/recommendation");
  return { success: "common.saved" };
}
