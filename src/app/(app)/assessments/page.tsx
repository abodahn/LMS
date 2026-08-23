import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, Clock, RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { attemptEligibility } from "@/lib/assessment/service";
import { getCertificationPolicy } from "@/lib/settings";
import { formatDateTime, formatDate } from "@/lib/utils";
import { Badge, Card, EmptyState, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { StartAssessmentButton } from "./start-button";
import { LevelChip } from "@/components/level-chip";

export const metadata: Metadata = { title: "Assessments" };

export default async function AssessmentsPage({ searchParams }: PageProps<"/assessments">) {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : null;

  const definitions = await prisma.assessmentDefinition.findMany({
    where: {
      status: "PUBLISHED",
      // Course quizzes are taken inside the course player, not from this list.
      type: { in: ["PLACEMENT", "TECHNICAL", "FINAL", "RESPONSIBLE_AI"] },
    },
  });

  // Present them in the order an employee meets them, not alphabetically.
  const TYPE_ORDER = ["PLACEMENT", "TECHNICAL", "RESPONSIBLE_AI", "FINAL"];
  definitions.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

  const rows = await Promise.all(
    definitions.map(async (d) => ({
      definition: d,
      eligibility: await attemptEligibility(user.id, d.id),
      history: await prisma.assessmentAttempt.findMany({
        where: { userId: user.id, definitionId: d.id, status: "GRADED" },
        orderBy: { submittedAt: "desc" },
        include: { level: true },
      }),
    })),
  );

  // The final assessment only opens once enough of the path is done.
  const policy = await getCertificationPolicy();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: { not: "DROPPED" } },
    include: { course: { select: { estimatedHours: true } } },
  });
  const totalHours = enrollments.reduce((s, e) => s + e.course.estimatedHours, 0);
  const doneHours = enrollments.reduce((s, e) => s + (e.course.estimatedHours * e.progressPercent) / 100, 0);
  const pathPercent = totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100);
  const finalUnlocked = pathPercent >= policy.completionThreshold;

  const relevant = rows.filter((r) => {
    if (r.definition.type !== "TECHNICAL") return true;
    // The technical track is offered only where it is actually relevant.
    return user.isTechnical || r.history.length > 0 || (rows[0]?.history[0]?.percentage ?? 0) >= 65;
  });

  return (
    <div className="space-y-6">
      <SectionHeading title={t("nav.assessments")} subtitle={t("assessment.baselineNote")} />

      {errorCode ? (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--brand-red)_35%,transparent)] bg-[var(--brand-red-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-red-dark)]"
        >
          {errorCode === "NO_ATTEMPTS" ? t("assessment.noAttempts") : t("errors.generic")}
        </div>
      ) : null}

      {relevant.length === 0 ? (
        <EmptyState
          title={t("common.noResults")}
          body={t("errors.notFoundBody")}
          icon={<ClipboardList size={20} />}
        />
      ) : null}

      <div className="grid gap-4">
        {relevant.map(({ definition, eligibility, history }) => {
          const best = history[0];
          return (
            <Card key={definition.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[var(--brand-ink)]">
                      {localized(definition, "title", locale)}
                    </h2>
                    {definition.type === "RESPONSIBLE_AI" ? (
                      <Badge tone="brand">{t("common.required")}</Badge>
                    ) : null}
                    {definition.type === "TECHNICAL" ? <Badge tone="muted">{t("common.optional")}</Badge> : null}
                  </div>
                  <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--brand-muted)]">
                    {localized(definition, "description", locale)}
                  </p>
                  <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--brand-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} aria-hidden />
                      {definition.durationMinutes} {t("common.minutes")}
                    </span>
                    <span>
                      {definition.questionCount} {t("common.questions")}
                    </span>
                    {definition.passingScore > 0 ? (
                      <span>
                        {t("common.required")}: {definition.passingScore}%
                      </span>
                    ) : null}
                    <span>{t("assessment.attemptsLeft", { count: eligibility.remaining })}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  {eligibility.open ? (
                    <LinkButton href={`/assessment/${eligibility.open.id}`} size="md">
                      {t("assessment.resume")}
                      <ArrowRight size={16} className="rtl:rotate-180" />
                    </LinkButton>
                  ) : definition.type === "FINAL" && !finalUnlocked ? (
                    <p className="max-w-56 text-[13px] text-[var(--brand-muted)]">
                      {t("assessment.finalLocked", { percent: policy.completionThreshold })}
                    </p>
                  ) : eligibility.canStart ? (
                    <StartAssessmentButton
                      definitionId={definition.id}
                      label={history.length ? t("assessment.reviewAndRetry") : t("assessment.startNew")}
                      variant={history.length ? "secondary" : "primary"}
                    />
                  ) : eligibility.cooldownUntil ? (
                    <p className="text-[13px] text-[var(--brand-muted)]">
                      {t("assessment.cooldown", { time: formatDate(eligibility.cooldownUntil, locale) })}
                    </p>
                  ) : (
                    <p className="max-w-56 text-[13px] text-[var(--brand-muted)]">{t("assessment.noAttempts")}</p>
                  )}
                </div>
              </div>

              {history.length > 0 ? (
                <div className="mt-4 border-t border-[var(--brand-line)] pt-4">
                  <p className="section-title mb-2">{t("passport.assessmentHistory")}</p>
                  <ul className="space-y-2">
                    {history.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
                        <span className="flex items-center gap-3">
                          <span className="text-[var(--brand-muted)]">
                            {formatDateTime(a.submittedAt, locale)}
                          </span>
                          {a.level ? <LevelChip code={a.level.code} name={localized(a.level, "name", locale)} size="sm" /> : null}
                          {definition.passingScore > 0 ? (
                            <StatusPill
                              status={a.passed ? "COMPLETED" : "PENDING"}
                              label={a.passed ? t("assessment.passed") : t("assessment.notPassed")}
                            />
                          ) : null}
                        </span>
                        <Link
                          href={`/assessment/${a.id}/result`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                        >
                          {t("common.view")}
                          <ArrowRight size={13} className="rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {best && !best.passed && definition.passingScore > 0 ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[var(--brand-muted)]">
                      <RotateCcw size={13} aria-hidden />
                      {t("assessment.almostThereBody")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
