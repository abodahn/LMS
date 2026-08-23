"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { AI_EXPERIENCE, LEARNING_GOALS } from "@/lib/constants";
import { generateRecommendations } from "@/lib/recommendation/service";

export type OnboardingState = { error?: string };

const profileSchema = z.object({
  yearsExperience: z.coerce.number().int().min(0).max(60),
  aiExperience: z.enum(AI_EXPERIENCE),
  isTechnical: z.enum(["yes", "no"]),
  weeklyLearningHours: z.coerce.number().min(0.5).max(20),
  mainTasks: z.string().trim().max(600).optional(),
});

export async function saveProfileStep(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const data = {
    yearsExperience: parsed.data.yearsExperience,
    aiExperience: parsed.data.aiExperience,
    isTechnical: parsed.data.isTechnical === "yes",
    weeklyLearningHours: parsed.data.weeklyLearningHours,
    mainTasks: parsed.data.mainTasks || null,
    onboardingStep: "ASSESSMENT",
  };

  await prisma.employeeProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  await audit({ actorId: user.id, actorName: user.fullName, action: "PROFILE_UPDATE", entity: "EmployeeProfile", entityId: user.id, after: data });
  redirect("/onboarding/assessment");
}

export async function saveGoalsStep(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  const goals = formData.getAll("goals").map(String).filter((g) => (LEARNING_GOALS as readonly string[]).includes(g));

  await prisma.userLearningGoal.deleteMany({ where: { userId: user.id } });
  for (const [i, goalKey] of goals.entries()) {
    await prisma.userLearningGoal.create({ data: { userId: user.id, goalKey, priority: i + 1 } });
  }

  await prisma.employeeProfile.updateMany({
    where: { userId: user.id },
    data: { onboardingStep: "PATH", onboardedAt: new Date() },
  });

  // Goals feed the engine, so the path is rebuilt as soon as they are known.
  await generateRecommendations(user.id);

  const latest = await prisma.assessmentAttempt.findFirst({
    where: { userId: user.id, status: "GRADED", definition: { type: "PLACEMENT" } },
    orderBy: { submittedAt: "desc" },
  });

  redirect(latest ? `/assessment/${latest.id}/result` : "/");
}
