import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { localized } from "@/lib/i18n";
import { getAttempt, toQuestionViews } from "@/lib/assessment/service";
import { AssessmentRunner } from "./runner";

export const metadata: Metadata = { title: "Assessment" };

export default async function AssessmentRunnerPage({ params }: PageProps<"/assessment/[attemptId]">) {
  const user = await requireUser();
  const { attemptId } = await params;
  const { locale } = await getI18n();

  const attempt = await getAttempt(attemptId, user.id);
  if (!attempt) notFound();
  if (attempt.status !== "IN_PROGRESS") redirect(`/assessment/${attemptId}/result`);

  const questions = toQuestionViews(attempt, locale);
  const deadline = attempt.expiresAt?.toISOString() ?? null;

  return (
    <AssessmentRunner
      attemptId={attempt.id}
      title={localized(attempt.definition, "title", locale)}
      questions={questions}
      startIndex={Math.min(attempt.currentIndex, Math.max(0, questions.length - 1))}
      deadline={deadline}
      elapsedSeconds={attempt.timeSpentSeconds}
    />
  );
}
