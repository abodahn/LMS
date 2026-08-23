import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading, StatCard } from "@/components/ui/primitives";
import { DefinitionForm } from "../definition-form";
import { loadAssessmentBuilderData } from "../assessment-data";

export const metadata: Metadata = { title: "Edit assessment" };

export default async function EditAssessmentPage({ params }: PageProps<"/admin/assessments/[definitionId]">) {
  await requirePermission("assessments.manage");
  const { definitionId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [definition, builder, attempts] = await Promise.all([
    prisma.assessmentDefinition.findUnique({ where: { id: definitionId }, include: { pools: true } }),
    loadAssessmentBuilderData(locale),
    prisma.assessmentAttempt.findMany({ where: { definitionId, status: "GRADED" }, select: { percentage: true, passed: true } }),
  ]);
  if (!definition) notFound();

  const pools: Record<string, number> = {};
  for (const p of definition.pools) pools[`${p.competencyId}.${p.difficulty ?? "MEDIUM"}`] = p.count;

  const average =
    attempts.length === 0 ? null : Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length);
  const passRate =
    attempts.length === 0 ? null : Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/assessments"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.assessments")}
      </Link>
      <SectionHeading title={definition.title} subtitle={definition.key} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("form.gradedAttempts")} value={attempts.length} />
        <StatCard label={t("common.average")} value={average == null ? "—" : `${average}%`} />
        <StatCard label={t("assessment.passed")} value={passRate == null ? "—" : `${passRate}%`} />
      </div>

      <DefinitionForm
        competencies={builder.competencies}
        available={builder.available}
        initial={{
          id: definition.id,
          key: definition.key,
          title: definition.title,
          description: definition.description ?? "",
          type: definition.type,
          durationMinutes: definition.durationMinutes,
          passingScore: definition.passingScore,
          maxAttempts: definition.maxAttempts,
          cooldownMinutes: definition.cooldownMinutes,
          randomizeQuestions: definition.randomizeQuestions,
          randomizeOptions: definition.randomizeOptions,
          isAdaptive: definition.isAdaptive,
          status: definition.status,
          pools,
        }}
      />
    </div>
  );
}
