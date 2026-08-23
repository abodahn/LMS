import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, GraduationCap, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { getLearnerSnapshot } from "@/lib/learner";
import { formatDate, formatHours } from "@/lib/utils";
import { Card, EmptyState, Progress, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { PaceSelector } from "./pace-selector";

export const metadata: Metadata = { title: "My Learning" };

export default async function LearningPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const snapshot = await getLearnerSnapshot(user.id);
  const { enrollments, totals, plan } = snapshot;

  if (enrollments.length === 0) {
    // A learner who has been assessed already has a path waiting — send them
    // to it rather than back to the assessment they just finished.
    const suggested = snapshot.latestAttempt
      ? await prisma.recommendation.count({ where: { userId: user.id, status: "SUGGESTED" } })
      : 0;

    return (
      <div className="space-y-6">
        <SectionHeading title={t("learning.myLearning")} />
        <EmptyState
          title={suggested > 0 ? t("action.buildPath") : t("dashboard.noPathTitle")}
          body={suggested > 0 ? t("action.buildPathBody") : t("dashboard.noPathBody")}
          icon={<GraduationCap size={20} />}
          action={
            suggested > 0 && snapshot.latestAttempt ? (
              <LinkButton href={`/assessment/${snapshot.latestAttempt.id}/result`}>
                {t("assessment.startPath")}
              </LinkButton>
            ) : (
              <LinkButton href="/assessments">{t("dashboard.noPathCta")}</LinkButton>
            )
          }
        />
      </div>
    );
  }

  // Keep the engine's phase order; anything unphased falls to the end.
  const phases: { title: string; items: typeof enrollments }[] = [];
  for (const e of enrollments) {
    const key = e.phase ?? t("learning.optional");
    let bucket = phases.find((p) => p.title === key);
    if (!bucket) {
      bucket = { title: key, items: [] };
      phases.push(bucket);
    }
    bucket.items.push(e);
  }

  // Sequence locks come from the learning path definition, not from ordering.
  const pathIds = [...new Set(enrollments.map((e) => e.pathId).filter(Boolean))] as string[];
  const lockedCourseIds = new Set(
    (
      await prisma.learningPathCourse.findMany({
        where: { pathId: { in: pathIds }, sequenceLock: true },
        select: { courseId: true },
      })
    ).map((r) => r.courseId),
  );

  return (
    <div className="space-y-6">
      <SectionHeading title={t("learning.myLearning")} subtitle={plan?.path?.title ?? undefined} />

      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="section-title">{t("learning.pathProgress")}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--brand-ink)]">
              {totals.pathPercent}%
            </p>
          </div>
          <p className="text-[13px] text-[var(--brand-muted)]">
            {t("dashboard.completedOf", { done: formatHours(totals.doneHours) })} ·{" "}
            {t("dashboard.remaining", { time: formatHours(totals.remainingHours) })} · {totals.coursesDone}/
            {totals.coursesTotal} {t("common.courses")}
          </p>
        </div>
        <Progress value={totals.pathPercent} className="mt-3" label={`${totals.pathPercent}%`} />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--brand-line)] pt-4">
          <div>
            <p className="section-title">{t("dashboard.planTitle")}</p>
            {plan?.targetDate ? (
              <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
                {t("dashboard.planTarget", { date: formatDate(plan.targetDate, locale) })}
              </p>
            ) : null}
          </div>
          <PaceSelector current={plan?.hoursPerWeek ?? 2} />
        </div>
      </Card>

      {phases.map((phase) => (
        <section key={phase.title}>
          <h2 className="section-title mb-3">{phase.title}</h2>
          <ul className="grid gap-3">
            {phase.items.map((e) => {
              const locked =
                e.status === "NOT_STARTED" &&
                lockedCourseIds.has(e.courseId) &&
                enrollments.some((other) => other.order < e.order && other.status !== "COMPLETED");
              const internal = e.course.isInternal || e.course.modules.length > 0;
              return (
                <li key={e.id}>
                  <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[var(--brand-ink)]">
                          {localized(e.course, "title", locale)}
                        </h3>
                        <StatusPill status={e.status} />
                        {!internal ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--brand-muted)]">
                            <ExternalLink size={12} aria-hidden />
                            {e.course.provider.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
                        {formatHours(e.course.estimatedHours)}
                        {e.course.aiLevel ? ` · ${e.course.aiLevel.code}` : ""}
                        {e.dueAt ? ` · ${t("learning.expectedCompletion")} ${formatDate(e.dueAt, locale)}` : ""}
                      </p>
                      {e.status !== "NOT_STARTED" ? (
                        <div className="mt-3 max-w-sm">
                          <Progress
                            value={e.progressPercent}
                            label={`${Math.round(e.progressPercent)}%`}
                            tone={e.status === "COMPLETED" ? "success" : "brand"}
                          />
                          <p className="mt-1 text-[12px] text-[var(--brand-muted)]">
                            {Math.round(e.progressPercent)}%
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {locked ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--brand-muted)]">
                          <Lock size={14} aria-hidden />
                          {t("learning.locked")}
                        </span>
                      ) : (
                        <LinkButton
                          href={`/learning/${e.id}`}
                          variant={e.status === "COMPLETED" ? "secondary" : "primary"}
                          size="md"
                        >
                          {e.status === "COMPLETED"
                            ? t("learning.reviewCourse")
                            : e.status === "IN_PROGRESS"
                              ? t("learning.resumeCourse")
                              : t("learning.startCourse")}
                          <ArrowRight size={16} className="rtl:rotate-180" />
                        </LinkButton>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-center text-[13px] text-[var(--brand-muted)]">
        <Link href="/catalog" className="font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline">
          {t("learning.browseCatalog")}
        </Link>
      </p>
    </div>
  );
}
