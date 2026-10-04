"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { METRICS } from "@/lib/engagement";

export type ChallengeState = { error?: string; success?: string };

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(120),
  titleAr: z.string().trim().max(120).optional(),
  titleTr: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  metric: z.enum(METRICS),
  target: z.union([z.literal(""), z.coerce.number().int().min(1).max(10_000_000)]).optional(),
  departmentId: z.string().optional(), // "" = every department
  startsOn: day,
  endsOn: day,
});

/**
 * Dates are whole days in UTC, the same calendar the learning-activity days
 * are kept in, so a challenge counts exactly the days it says it does.
 */
export async function saveChallengeAction(_prev: ChallengeState, formData: FormData): Promise<ChallengeState> {
  const admin = await requirePermission("engagement.manage");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const startsAt = new Date(`${d.startsOn}T00:00:00.000Z`);
  const endsAt = new Date(`${d.endsOn}T23:59:59.999Z`);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { error: "challenges.badDates" };
  }
  if (d.departmentId && !(await prisma.department.findUnique({ where: { id: d.departmentId } }))) {
    return { error: "errors.validation" };
  }

  const data = {
    title: d.title,
    titleAr: d.titleAr || null,
    titleTr: d.titleTr || null,
    description: d.description || null,
    metric: d.metric,
    target: typeof d.target === "number" ? d.target : null,
    departmentId: d.departmentId || null,
    startsAt,
    endsAt,
  };
  const before = d.id ? await prisma.challenge.findUnique({ where: { id: d.id } }) : null;
  if (d.id && !before) return { error: "errors.validation" };
  // A different department or start date means a different set of entrants.
  if (before && (before.departmentId !== data.departmentId || before.startsAt.getTime() !== startsAt.getTime())) {
    await prisma.challengeEntrant.deleteMany({ where: { challengeId: before.id } });
  }
  const saved = d.id
    ? await prisma.challenge.update({ where: { id: d.id }, data })
    : await prisma.challenge.create({
        data: { ...data, createdById: admin.id },
      });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.id ? "CHALLENGE_UPDATED" : "CHALLENGE_CREATED",
    entity: "Challenge",
    entityId: saved.id,
    summary: `${d.title} (${d.metric}, ${d.startsOn} → ${d.endsOn})`,
  });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  return { success: "common.saved" };
}

export async function toggleChallengeAction(_prev: ChallengeState, formData: FormData): Promise<ChallengeState> {
  const admin = await requirePermission("engagement.manage");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) return { error: "errors.validation" };
  await prisma.challenge.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: existing.isActive ? "CHALLENGE_PAUSED" : "CHALLENGE_RESUMED",
    entity: "Challenge",
    entityId: id,
    summary: existing.title,
  });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  return { success: "common.saved" };
}
