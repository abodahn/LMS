import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { QuestionEditor } from "../question-editor";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";

export const metadata: Metadata = { title: "New question" };

export default async function NewQuestionPage() {
  await requirePermission("assessments.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [competencies, banks] = await Promise.all([
    prisma.competency
      .findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } })
      .then((rows) => localizeNames(rows, locale)),
    prisma.questionBank.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/questions"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.questions")}
      </Link>
      <SectionHeading title={t("common.create")} subtitle={t("admin.questions")} />
      <QuestionEditor
        competencies={competencies}
        banks={banks}
        initial={{
          bankId: banks[0]?.id ?? "",
          competencyId: competencies[0]?.id ?? "",
          type: "SINGLE",
          difficulty: "MEDIUM",
          text: "",
          textAr: "",
          textTr: "",
          explanation: "",
          points: 1,
          status: "DRAFT",
          isTechnical: false,
          options: [
            { text: "", textAr: "", textTr: "", isCorrect: true, feedback: "" },
            { text: "", textAr: "", textTr: "", isCorrect: false, feedback: "" },
            { text: "", textAr: "", textTr: "", isCorrect: false, feedback: "" },
          ],
        }}
      />
    </div>
  );
}
