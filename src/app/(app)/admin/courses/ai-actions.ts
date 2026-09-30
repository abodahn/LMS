"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { AiBadOutputError, AiDisabledError, AiTruncatedError } from "@/lib/ai/provider";
import { AiBudgetExceededError } from "@/lib/ai/budget";
import { AiNoMaterialError, draftCourse, draftQuiz, summarizeCourse, translateCourse } from "@/lib/ai/authoring";

export type AiState = { error?: string; success?: string };

/**
 * Every AI action's failures, as message keys. The provider's
 * own error text is never passed through — it can carry request details, and
 * it is not something an administrator can act on.
 */
function failure(e: unknown): string {
  if (e instanceof AiDisabledError) return "ai.disabled";
  if (e instanceof AiBudgetExceededError) return "ai.budget";
  if (e instanceof AiBadOutputError) return "ai.badOutput";
  if (e instanceof AiTruncatedError) return "ai.truncated";
  if (e instanceof AiNoMaterialError) return "ai.noMaterial";
  console.error("[ai] authoring failed:", e instanceof Error ? e.message : e);
  return "ai.failed";
}

const briefSchema = z.object({
  topic: z.string().trim().min(3).max(300),
  audience: z.string().trim().min(3).max(300),
  language: z.enum(["en", "ar", "tr"]),
  // Four hours is what one reply can hold as real lesson text. A longer
  // course is several drafts, one per part — asked for as one it came back
  // cut off, and was billed anyway.
  hours: z.coerce.number().min(0.25).max(4),
});

export async function draftCourseAction(_prev: AiState, formData: FormData): Promise<AiState> {
  const user = await requirePermission("catalog.manage");
  const parsed = briefSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  let courseId: string;
  try {
    courseId = await draftCourse(parsed.data, user);
  } catch (e) {
    return { error: failure(e) };
  }
  // Straight to the editor: a draft nobody opens is a draft nobody reviews.
  redirect(`/admin/courses/${courseId}?drafted=1`);
}

const quizSchema = z.object({
  courseId: z.string().min(1),
  count: z.coerce.number().int().min(1).max(20),
});

export async function draftQuizAction(_prev: AiState, formData: FormData): Promise<AiState> {
  const user = await requirePermission("assessments.manage");
  const parsed = quizSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  try {
    const { created } = await draftQuiz(parsed.data.courseId, parsed.data.count, user);
    return { success: `ai.quizDrafted:${created}` };
  } catch (e) {
    return { error: failure(e) };
  }
}

const summarySchema = z.object({
  title: z.string().trim().min(1).max(200),
  text: z.string().trim().min(20).max(20_000),
  language: z.enum(["en", "ar", "tr"]),
});

/** Returns text for the form; saves nothing. */
export async function summarizeAction(input: z.infer<typeof summarySchema>) {
  const user = await requirePermission("catalog.manage");
  const parsed = summarySchema.safeParse(input);
  // Said specifically: the generic validation message points at highlighted
  // fields, and nothing here is highlighted.
  if (!parsed.success) return { error: "ai.needText" };
  try {
    return { text: await summarizeCourse(parsed.data, user.id) };
  } catch (e) {
    return { error: failure(e) };
  }
}

const translateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  outcomes: z.array(z.string().max(300)).max(8),
  to: z.enum(["ar", "tr"]),
});

/** Returns a translation for the form; saves nothing. */
export async function translateAction(input: z.infer<typeof translateSchema>) {
  const user = await requirePermission("catalog.manage");
  const parsed = translateSchema.safeParse(input);
  if (!parsed.success) return { error: "ai.needDescription" };
  try {
    return { translation: await translateCourse(parsed.data, parsed.data.to, user.id) };
  } catch (e) {
    return { error: failure(e) };
  }
}
