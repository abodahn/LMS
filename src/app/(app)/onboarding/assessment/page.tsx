import type { Metadata } from "next";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { OnboardingSteps } from "../steps";
import { StartAssessmentButton } from "@/app/(app)/assessments/start-button";

export const metadata: Metadata = { title: "Your AI assessment" };

export default async function OnboardingAssessmentPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const definition = await prisma.assessmentDefinition.findUniqueOrThrow({ where: { key: "PLACEMENT_V1" } });
  const open = await prisma.assessmentAttempt.findFirst({
    where: { userId: user.id, definitionId: definition.id, status: "IN_PROGRESS" },
  });

  const competencies = await prisma.competency.findMany({
    where: { isCore: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
          {t("onboarding.readyTitle")}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--brand-muted)]">
          {t("onboarding.readySubtitle", { count: definition.questionCount })}
        </p>
      </header>

      <OnboardingSteps current={2} />

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">
          {localized(definition, "title", locale)}
        </h2>

        <ul className="mt-4 space-y-2.5 text-sm text-[var(--brand-charcoal)]">
          <li className="flex items-start gap-2.5">
            <Clock size={17} className="mt-0.5 shrink-0 text-[var(--brand-muted)]" aria-hidden />
            {t("onboarding.estimated")}
          </li>
          <li className="flex items-start gap-2.5">
            <Sparkles size={17} className="mt-0.5 shrink-0 text-[var(--brand-muted)]" aria-hidden />
            {t("assessment.autosaved")}
          </li>
          <li className="flex items-start gap-2.5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--brand-muted)]" aria-hidden />
            {t("assessment.baselineNote")}
          </li>
        </ul>

        <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-4">
          <p className="section-title">{t("assessment.detailedScores")}</p>
          <ul className="mt-2 space-y-1.5">
            {competencies.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-[var(--brand-ink)]">{localized(c, "name", locale)}</span>
                <span className="text-[var(--brand-muted)]">{Math.round(c.weight * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <StartAssessmentButton
            definitionId={definition.id}
            label={open ? t("assessment.resume") : t("onboarding.startAssessment")}
            size="lg"
          />
        </div>
      </section>
    </div>
  );
}
