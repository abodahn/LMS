import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CircleCheck, Clock, Sparkles, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { getAttempt, remediationFor } from "@/lib/assessment/service";
import { strengthsAndGaps } from "@/lib/assessment/scoring";
import { formatHours } from "@/lib/utils";
import { Alert, Badge, Card } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { LevelChip } from "@/components/level-chip";
import { SkillAnalysis } from "./skill-analysis";
import { EnrollPathButton } from "./enroll-button";
import { StartAssessmentButton } from "@/app/(app)/assessments/start-button";

export const metadata: Metadata = { title: "Your AI level" };

export default async function AssessmentResultPage({ params }: PageProps<"/assessment/[attemptId]/result">) {
  const user = await requireUser();
  const { attemptId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const attempt = await getAttempt(attemptId, user.id);
  if (!attempt || attempt.status === "IN_PROGRESS") notFound();

  const scores = attempt.scores.map((s) => ({
    competencyId: s.competencyId,
    key: s.competency.key,
    name: localized(s.competency, "name", locale),
    rawScore: s.rawScore,
    maxScore: s.maxScore,
    percentage: s.percentage,
  }));
  const { strengths, gaps } = strengthsAndGaps(scores);
  const nameOf = (key: string) => scores.find((s) => s.key === key)?.name ?? key;

  const run = await prisma.recommendationRun.findFirst({
    where: { userId: user.id },
    orderBy: { generatedAt: "desc" },
    include: {
      recommendations: {
        orderBy: { rank: "asc" },
        include: { course: { include: { provider: true, aiLevel: true } }, reasons: true },
      },
    },
  });

  const path = run?.pathId ? await prisma.learningPath.findUnique({ where: { id: run.pathId } }) : null;
  const targetLevel = path?.targetLevelId
    ? await prisma.skillLevel.findUnique({ where: { id: path.targetLevelId } })
    : null;

  const alreadyEnrolled = (await prisma.enrollment.count({ where: { userId: user.id } })) > 0;
  const remediation = attempt.definition.passingScore > 0 && !attempt.passed ? await remediationFor(attempt.id) : [];

  const technicalDef = await prisma.assessmentDefinition.findUnique({ where: { key: "TECHNICAL_V1" } });
  const technicalTaken = technicalDef
    ? (await prisma.assessmentAttempt.count({
        where: { userId: user.id, definitionId: technicalDef.id, status: "GRADED" },
      })) > 0
    : true;
  const offerTechnical =
    !!technicalDef &&
    !technicalTaken &&
    attempt.definition.type === "PLACEMENT" &&
    (user.isTechnical || attempt.percentage >= 65);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Level, never a bare score */}
      <section className="card overflow-hidden">
        <div className="border-b border-[var(--brand-line)] bg-[var(--brand-canvas)] px-6 py-6">
          <p className="section-title">{t("assessment.resultTitle")}</p>
          {attempt.level ? (
            <div className="mt-2.5">
              <LevelChip code={attempt.level.code} name={localized(attempt.level, "name", locale)} size="lg" />
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--brand-charcoal)]">
                {localized(attempt.level, "description", locale)}
              </p>
            </div>
          ) : (
            <div className="mt-2.5">
              <p className="text-2xl font-semibold text-[var(--brand-ink)]">
                {attempt.passed ? t("assessment.passed") : t("assessment.notPassed")}
              </p>
              <p className="mt-1 text-sm text-[var(--brand-muted)]">
                {Math.round(attempt.percentage)}% · {t("common.required")} {attempt.definition.passingScore}%
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
          <div>
            <p className="section-title">{t("assessment.strengths")}</p>
            <ul className="mt-2.5 space-y-1.5">
              {strengths.length === 0 ? (
                <li className="text-[13px] text-[var(--brand-muted)]">{t("common.notAvailable")}</li>
              ) : (
                strengths.map((s) => (
                  <li key={s.key} className="flex items-center gap-2 text-sm text-[var(--brand-ink)]">
                    <CircleCheck size={16} className="shrink-0 text-[var(--brand-success)]" aria-hidden />
                    {nameOf(s.key)}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <p className="section-title">{t("assessment.developmentAreas")}</p>
            <ul className="mt-2.5 space-y-1.5">
              {gaps.length === 0 ? (
                <li className="text-[13px] text-[var(--brand-muted)]">{t("common.notAvailable")}</li>
              ) : (
                gaps.map((g) => (
                  <li key={g.key} className="flex items-center gap-2 text-sm text-[var(--brand-ink)]">
                    <TriangleAlert size={16} className="shrink-0 text-[var(--brand-warning)]" aria-hidden />
                    {nameOf(g.key)}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--brand-line)] px-6 py-5">
          <SkillAnalysis
            scores={scores.map((s) => ({ name: s.name, percentage: s.percentage }))}
            overall={attempt.percentage}
          />
        </div>
      </section>

      {remediation.length > 0 ? (
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--brand-ink)]">{t("assessment.almostThere")}</h2>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">{t("assessment.almostThereBody")}</p>
          <p className="section-title mt-4">{t("assessment.recommendedReview")}</p>
          <div className="mt-2 space-y-4">
            {remediation.map((r) => (
              <div key={r.competencyKey}>
                <p className="text-sm font-semibold text-[var(--brand-ink)]">
                  {nameOf(r.competencyKey)}{" "}
                  <span className="font-normal text-[var(--brand-muted)]">{Math.round(r.percentage)}%</span>
                </p>
                <ul className="mt-1.5 space-y-1">
                  {r.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-[13px] text-[var(--brand-charcoal)]">
                      <Clock size={13} className="text-[var(--brand-muted)]" aria-hidden />
                      <span>
                        {l.title} · {l.minutes} {t("common.minutesShort")}
                        <span className="ms-1 text-[var(--brand-muted)]">— {l.courseTitle}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href="/learning" size="sm">
              {t("assessment.reviewAndRetry")}
            </LinkButton>
            <Link
              href="/assessments"
              className="inline-flex h-8 items-center rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-canvas)]"
            >
              {t("nav.assessments")}
            </Link>
          </div>
        </section>
      ) : null}

      {/* Recommendation — explainable, never a black box */}
      {run && run.recommendations.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="border-b border-[var(--brand-line)] px-6 py-5">
            <p className="section-title">{t("assessment.recommendedForYou")}</p>
            <h2 className="mt-1.5 text-xl font-semibold text-[var(--brand-ink)]">
              {path ? localized(path, "title", locale) : t("dashboard.yourLearningPath")}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--brand-muted)]">
              <span>
                {t("assessment.estimatedTime")}:{" "}
                <strong className="font-semibold text-[var(--brand-ink)]">{formatHours(run.totalHours)}</strong>
              </span>
              {targetLevel ? (
                <span>
                  {t("assessment.expectedOutcome")}:{" "}
                  <strong className="font-semibold text-[var(--brand-ink)]">
                    {targetLevel.code} — {localized(targetLevel, "name", locale)}
                  </strong>
                </span>
              ) : null}
              <span>
                {run.recommendations.length} {t("common.courses")}
              </span>
            </div>
            <div className="mt-4">
              {alreadyEnrolled ? (
                <LinkButton href="/learning" size="lg">
                  {t("dashboard.continueLearning")}
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </LinkButton>
              ) : (
                <EnrollPathButton runId={run.id} label={t("assessment.startPath")} />
              )}
            </div>
          </div>

          <ol className="divide-y divide-[var(--brand-line)]">
            {run.recommendations.map((rec) => (
              <li key={rec.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {rec.phase ? <p className="section-title">{rec.phase}</p> : null}
                    <h3 className="mt-1 text-[15px] font-semibold text-[var(--brand-ink)]">
                      {rec.course ? localized(rec.course, "title", locale) : ""}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                      {rec.course?.provider.name} · {formatHours(rec.course?.estimatedHours ?? 0)}
                      {rec.course?.aiLevel ? ` · ${rec.course.aiLevel.code}` : ""}
                    </p>
                  </div>
                  <Badge tone="brand" icon={<Sparkles size={12} />}>
                    {Math.round(rec.score)}% {t("common.match")}
                  </Badge>
                </div>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {rec.reasons.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 text-[13px] text-[var(--brand-charcoal)]">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-[var(--brand-success)]" aria-hidden />
                      {r.label}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {offerTechnical && technicalDef ? (
        <Alert tone="info" title={t("assessment.technicalOfferTitle")} icon={<Sparkles size={16} />}>
          <p>{t("assessment.technicalOfferBody")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StartAssessmentButton
              definitionId={technicalDef.id}
              label={t("assessment.takeTechnical")}
              size="sm"
            />
            <Link
              href="/learning"
              className="inline-flex items-center rounded-[var(--radius-control)] px-3 py-1.5 text-[13px] font-semibold text-[var(--brand-charcoal)] hover:bg-white"
            >
              {t("assessment.skipTechnical")}
            </Link>
          </div>
        </Alert>
      ) : null}

      {attempt.definition.type === "PLACEMENT" && !alreadyEnrolled && !run ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--brand-muted)]">{t("dashboard.noPathBody")}</p>
          <LinkButton href="/onboarding/goals" className="mt-3">
            {t("action.chooseGoals")}
          </LinkButton>
        </Card>
      ) : null}
    </div>
  );
}
