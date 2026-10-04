"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notifyTranslated } from "@/lib/notifications";
import { isNextRole } from "@/lib/careers";
import { skillProfileFor } from "@/lib/skills";

export type CareerState = { error?: string; success?: string };

const schema = z.object({ jobTitleId: z.string().min(1) });

/**
 * An employee asking their manager to plan for the next role.
 *
 * It proposes; it does not commit. Each gap against the next role becomes a
 * PROPOSED development goal, which means nothing until the manager approves it
 * — exactly as if the manager had drafted it. A skill that already has a goal
 * in any state is left alone: open, done or dropped, that row records the
 * manager's decision, and overwriting it from here would be the employee
 * reversing it.
 *
 * Only for a role one rung up. Proposing goals for any job in the company would
 * turn a development plan into a wish list.
 */
export async function requestCareerGoalsAction(_prev: CareerState, formData: FormData): Promise<CareerState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const { jobTitleId } = parsed.data;

  if (!(await isNextRole(user.id, jobTitleId))) return { error: "errors.forbidden" };
  const target = await prisma.jobTitle.findUniqueOrThrow({ where: { id: jobTitleId }, select: { id: true, name: true } });
  const profile = await skillProfileFor(user.id, target);
  if (profile.gaps.length === 0) return { error: "career.noGaps" };

  const existing = new Set(
    (await prisma.developmentGoal.findMany({ where: { userId: user.id }, select: { skillId: true } })).map(
      (g) => g.skillId,
    ),
  );

  const fresh = profile.gaps.filter((g) => !existing.has(g.skillId));
  // skipDuplicates is not available on SQLite; a parallel request racing this
  // one fails on the unique key instead, and the transaction keeps it all-or-nothing.
  await prisma.$transaction(
    fresh.map((gap) =>
      prisma.developmentGoal.create({
        data: {
          userId: user.id,
          skillId: gap.skillId,
          fromLevel: gap.held,
          targetLevel: gap.required,
          status: "PROPOSED",
          note: `Next role: ${target.name}`,
          createdById: user.id,
        },
      }),
    ),
  );
  const proposed = fresh.length;
  if (proposed === 0) return { error: "career.alreadyPlanned" };

  const manager = await prisma.user.findUnique({ where: { id: user.id }, select: { managerId: true } });
  if (manager?.managerId) {
    await notifyTranslated(manager.managerId, {
      category: "MANAGER",
      titleKey: "notify.careerRequestTitle",
      bodyKey: "notify.careerRequestBody",
      params: { name: user.fullName, role: target.name, count: proposed },
      link: `/team/${user.id}`,
    });
  }

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "CAREER_GOALS_REQUESTED",
    entity: "JobTitle",
    entityId: target.id,
    summary: `${proposed} goal(s) towards ${target.name}`,
  });

  revalidatePath("/career");
  return { success: `${manager?.managerId ? "career.requested" : "career.requestedNoManager"}:${proposed}` };
}
