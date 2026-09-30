"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { generateRecommendations } from "@/lib/recommendation/service";

export type TeamState = { error?: string; success?: string };

/** Managers may only act on their own reports. */
async function assertMyReport(managerId: string, userId: string) {
  const member = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true, fullName: true } });
  if (!member || member.managerId !== managerId) throw new Error("FORBIDDEN");
  return member;
}

export async function nominateCourseAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const manager = await requirePermission("team.nominate");
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const dueDays = Number(formData.get("dueDays") ?? 30);
  if (!userId || !courseId) return { error: "errors.validation" };

  try {
    const member = await assertMyReport(manager.id, userId);
    const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });

    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing) return { error: "learning.enrolled" };

    await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        source: "ASSIGNED",
        assignedById: manager.id,
        dueAt: new Date(Date.now() + Math.max(1, dueDays) * 86400000),
      },
    });

    await notify(userId, {
      category: "MANAGER",
      title: `${manager.fullName} recommended a course for you`,
      body: `${course.title} has been added to your learning.`,
      link: "/learning",
    });

    await audit({
      actorId: manager.id,
      actorName: manager.fullName,
      action: "COURSE_NOMINATION",
      entity: "Enrollment",
      entityId: userId,
      summary: `${member.fullName} → ${course.title}`,
    });

    revalidatePath(`/team/${userId}`);
    return { success: "common.saved" };
  } catch {
    return { error: "errors.forbidden" };
  }
}

const goalsSchema = z.object({ userId: z.string().min(1), goals: z.string().trim().max(2000) });

export async function setDevelopmentGoalsAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const manager = await requirePermission("team.nominate");
  const parsed = goalsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  try {
    await assertMyReport(manager.id, parsed.data.userId);
    await prisma.employeeProfile.upsert({
      where: { userId: parsed.data.userId },
      update: { managerGoals: parsed.data.goals || null },
      create: { userId: parsed.data.userId, managerGoals: parsed.data.goals || null },
    });

    // Manager goals are an engine input, so refresh the suggestions.
    const assessed = await prisma.assessmentAttempt.count({
      where: { userId: parsed.data.userId, status: "GRADED" },
    });
    if (assessed > 0) await generateRecommendations(parsed.data.userId);

    await audit({
      actorId: manager.id,
      actorName: manager.fullName,
      action: "DEVELOPMENT_GOALS_SET",
      entity: "EmployeeProfile",
      entityId: parsed.data.userId,
    });

    revalidatePath(`/team/${parsed.data.userId}`);
    return { success: "common.saved" };
  } catch {
    return { error: "errors.forbidden" };
  }
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

const rateSchema = z.object({
  userId: z.string().min(1),
  skillId: z.string().min(1),
  level: z.coerce.number().int().min(0).max(5),
  note: z.string().trim().max(500).optional(),
});

/**
 * A manager records what they have seen.
 *
 * Audited like any other privileged act, because this goes into someone's
 * record and can end up in a succession conversation. The note is kept for the
 * same reason: a level with no observation behind it is an opinion, and the
 * person rated is entitled to know which it was.
 */
export async function rateSkillAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const manager = await requirePermission("team.assess");
  const parsed = rateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  try {
    const member = await assertMyReport(manager.id, parsed.data.userId);
    const { rateSkill } = await import("@/lib/skills");
    const skill = await prisma.skill.findUniqueOrThrow({ where: { id: parsed.data.skillId } });

    await rateSkill({
      userId: parsed.data.userId,
      skillId: parsed.data.skillId,
      level: parsed.data.level,
      source: "MANAGER",
      ratedById: manager.id,
      note: parsed.data.note || null,
    });

    await audit({
      actorId: manager.id,
      actorName: manager.fullName,
      action: "SKILL_RATED",
      entity: "UserSkill",
      entityId: parsed.data.userId,
      summary: `${member.fullName} · ${skill.name} → ${parsed.data.level}`,
    });

    revalidatePath(`/team/${parsed.data.userId}`);
    return { success: "common.saved" };
  } catch {
    return { error: "errors.forbidden" };
  }
}

export async function proposePlanAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const manager = await requirePermission("team.assess");
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "errors.validation" };

  try {
    await assertMyReport(manager.id, userId);
    const { proposeDevelopmentPlan } = await import("@/lib/skills");
    const { created } = await proposeDevelopmentPlan(userId, manager.id);
    revalidatePath(`/team/${userId}`);
    return created > 0 ? { success: "skills.planDrafted" } : { success: "common.saved" };
  } catch {
    return { error: "errors.forbidden" };
  }
}

const goalSchema = z.object({
  goalId: z.string().min(1),
  userId: z.string().min(1),
  targetDate: z.string().trim().optional(),
  decision: z.enum(["APPROVED", "DROPPED"]),
});

/**
 * Approving is what makes a proposal a commitment, so it is the step that tells
 * the employee. A plan drafted by the system and never agreed by anyone is not
 * something to notify someone about.
 */
export async function decideGoalAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const manager = await requirePermission("team.assess");
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  try {
    const member = await assertMyReport(manager.id, parsed.data.userId);
    const goal = await prisma.developmentGoal.findUniqueOrThrow({
      where: { id: parsed.data.goalId },
      include: { skill: true },
    });
    if (goal.userId !== parsed.data.userId) return { error: "errors.forbidden" };

    const target = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
    await prisma.developmentGoal.update({
      where: { id: goal.id },
      data: {
        status: parsed.data.decision,
        targetDate: target && !Number.isNaN(target.getTime()) ? target : goal.targetDate,
        approvedById: parsed.data.decision === "APPROVED" ? manager.id : null,
        approvedAt: parsed.data.decision === "APPROVED" ? new Date() : null,
      },
    });

    if (parsed.data.decision === "APPROVED") {
      await notify(parsed.data.userId, {
        category: "MANAGER",
        title: `${manager.fullName} agreed a development goal with you`,
        body: `${goal.skill.name}: level ${goal.fromLevel} to ${goal.targetLevel}.`,
        link: "/skills",
      });
    }

    await audit({
      actorId: manager.id,
      actorName: manager.fullName,
      action: parsed.data.decision === "APPROVED" ? "DEVELOPMENT_GOAL_APPROVED" : "DEVELOPMENT_GOAL_DROPPED",
      entity: "DevelopmentGoal",
      entityId: goal.id,
      summary: `${member.fullName} · ${goal.skill.name}`,
    });

    revalidatePath(`/team/${parsed.data.userId}`);
    return { success: "common.saved" };
  } catch {
    return { error: "errors.forbidden" };
  }
}
