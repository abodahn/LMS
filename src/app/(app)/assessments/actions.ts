"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { AssessmentError, saveAnswer, startAttempt, submitAttempt } from "@/lib/assessment/service";

export async function startAssessmentAction(definitionId: string) {
  const user = await requireUser();
  try {
    const attempt = await startAttempt(user.id, definitionId);
    await audit({
      actorId: user.id,
      actorName: user.fullName,
      action: "ASSESSMENT_START",
      entity: "AssessmentAttempt",
      entityId: attempt.id,
    });
    redirect(`/assessment/${attempt.id}`);
  } catch (err) {
    if (err instanceof AssessmentError) redirect(`/assessments?error=${err.code}`);
    throw err;
  }
}

const saveSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string()).max(20).optional(),
  textAnswer: z.string().max(6000).nullish(),
  currentIndex: z.number().int().min(0).max(500).optional(),
  elapsedSeconds: z.number().int().min(0).max(86400).optional(),
});

export type SaveResult = { ok: boolean; error?: string };

export async function saveAnswerAction(input: z.infer<typeof saveSchema>): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.validation" };
  try {
    await saveAnswer({ ...parsed.data, userId: user.id });
    return { ok: true };
  } catch {
    return { ok: false, error: "errors.saveProgress" };
  }
}

export async function submitAssessmentAction(attemptId: string) {
  const user = await requireUser();
  const attempt = await submitAttempt(attemptId, user.id);
  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "ASSESSMENT_SUBMIT",
    entity: "AssessmentAttempt",
    entityId: attempt.id,
    summary: `${attempt.percentage}%`,
  });
  revalidatePath("/");
  redirect(`/assessment/${attemptId}/result`);
}
