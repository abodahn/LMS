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
