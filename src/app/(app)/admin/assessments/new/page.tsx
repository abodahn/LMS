import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { DefinitionForm } from "../definition-form";
import { loadAssessmentBuilderData } from "../assessment-data";

export const metadata: Metadata = { title: "New assessment" };

export default async function NewAssessmentPage() {
  await requirePermission("assessments.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const { competencies, available } = await loadAssessmentBuilderData(locale);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/assessments"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.assessments")}
      </Link>
      <SectionHeading title={t("common.create")} subtitle={t("admin.assessments")} />
      <DefinitionForm
        competencies={competencies}
        available={available}
        initial={{
          key: "",
          title: "",
          description: "",
          type: "MODULE",
          durationMinutes: 20,
          passingScore: 70,
          maxAttempts: 3,
          cooldownMinutes: 0,
          randomizeQuestions: true,
          randomizeOptions: true,
          isAdaptive: false,
          status: "DRAFT",
          pools: {},
        }}
      />
    </div>
  );
}
