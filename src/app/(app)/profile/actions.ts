"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { AI_EXPERIENCE, LEARNING_GOALS, LOCALES } from "@/lib/constants";
import { generateRecommendations } from "@/lib/recommendation/service";

export type ProfileState = { error?: string; success?: string };

const schema = z.object({
  preferredLanguage: z.enum(LOCALES),
  weeklyLearningHours: z.coerce.number().min(0.5).max(20),
  aiExperience: z.enum(AI_EXPERIENCE),
  isTechnical: z.enum(["yes", "no"]),
  mainTasks: z.string().trim().max(600).optional(),
});

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    preferredLanguage: formData.get("preferredLanguage"),
    weeklyLearningHours: formData.get("weeklyLearningHours"),
    aiExperience: formData.get("aiExperience"),
    isTechnical: formData.get("isTechnical"),
    mainTasks: formData.get("mainTasks"),
  });
  if (!parsed.success) return { error: "errors.validation" };

  const goals = formData
    .getAll("goals")
    .map(String)
    .filter((g) => (LEARNING_GOALS as readonly string[]).includes(g));

  await prisma.user.update({
    where: { id: user.id },
    data: { preferredLanguage: parsed.data.preferredLanguage },
  });

  await prisma.employeeProfile.upsert({
    where: { userId: user.id },
    update: {
      weeklyLearningHours: parsed.data.weeklyLearningHours,
      aiExperience: parsed.data.aiExperience,
      isTechnical: parsed.data.isTechnical === "yes",
      mainTasks: parsed.data.mainTasks || null,
    },
    create: {
      userId: user.id,
      weeklyLearningHours: parsed.data.weeklyLearningHours,
      aiExperience: parsed.data.aiExperience,
      isTechnical: parsed.data.isTechnical === "yes",
      mainTasks: parsed.data.mainTasks || null,
    },
  });

  await prisma.userLearningGoal.deleteMany({ where: { userId: user.id } });
  for (const [i, goalKey] of goals.entries()) {
    await prisma.userLearningGoal.create({ data: { userId: user.id, goalKey, priority: i + 1 } });
  }

  // Preferences drive the engine, so refresh the suggestions immediately.
  const hasAssessment = await prisma.assessmentAttempt.count({ where: { userId: user.id, status: "GRADED" } });
  if (hasAssessment > 0) await generateRecommendations(user.id);

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "PROFILE_UPDATE",
    entity: "EmployeeProfile",
    entityId: user.id,
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: "profile.updated" };
}
