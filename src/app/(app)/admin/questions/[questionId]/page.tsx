import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading, StatCard } from "@/components/ui/primitives";
import { QuestionEditor } from "../question-editor";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Edit question" };

export default async function EditQuestionPage({ params }: PageProps<"/admin/questions/[questionId]">) {
  await requirePermission("assessments.manage");
  const { questionId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [question, competencies, banks, usage, answers] = await Promise.all([
    prisma.assessmentQuestion.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    prisma.competency
      .findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } })
      .then((rows) => localizeNames(rows, locale)),
    prisma.questionBank.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.attemptQuestion.count({ where: { questionId } }),
    prisma.assessmentAnswer.findMany({ where: { questionId }, select: { isCorrect: true } }),
  ]);
  if (!question) notFound();

  const correctRate =
    answers.length === 0 ? null : Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/questions"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.questions")}
      </Link>
      <SectionHeading title={t("common.edit")} subtitle={question.text.slice(0, 120)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label={t("form.timesAsked")} value={usage} />
        <StatCard label={t("form.answered")} value={answers.length} />
        <StatCard label={t("form.correctRate")} value={correctRate == null ? "—" : `${correctRate}%`} />
      </div>

      <QuestionEditor
        competencies={competencies}
        banks={banks}
        initial={{
          id: question.id,
          bankId: question.bankId ?? "",
          competencyId: question.competencyId,
          type: question.type,
          difficulty: question.difficulty,
          text: question.text,
          textAr: question.textAr ?? "",
          textTr: question.textTr ?? "",
          explanation: question.explanation ?? "",
          points: question.points,
          status: question.status,
          isTechnical: question.isTechnical,
          options: question.options.map((o) => ({
            id: o.id,
            text: o.text,
            textAr: o.textAr ?? "",
            textTr: o.textTr ?? "",
            isCorrect: o.isCorrect,
            feedback: o.feedback ?? "",
          })),
        }}
      />
    </div>
  );
}
