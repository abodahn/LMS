import Link from "next/link";
import { ArrowRight, Award, BookOpen, ClipboardCheck, Flame, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { getLearnerSnapshot, nextBestAction } from "@/lib/learner";
import { myProgress } from "@/lib/engagement";
import { formatDate, formatHours, greetingKey } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader, Progress, StatCard } from "@/components/ui/primitives";
import { LevelChip } from "@/components/level-chip";

export default async function DashboardPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const [snapshot, progress] = await Promise.all([getLearnerSnapshot(user.id), myProgress(user.id)]);
  const action = await nextBestAction(snapshot);
  const { totals, level, plan, nextLesson, active } = snapshot;

  // Only the assessments an employee is actually asked to take.
  const LEARNER_ASSESSMENTS = ["PLACEMENT", "TECHNICAL", "FINAL", "RESPONSIBLE_AI"];
  const [assessmentsDone, assessmentsTotal] = await Promise.all([
    prisma.assessmentAttempt.count({
      where: { userId: user.id, status: "GRADED", definition: { type: { in: LEARNER_ASSESSMENTS } } },
    }),
    prisma.assessmentDefinition.count({
      where: { status: "PUBLISHED", type: { in: LEARNER_ASSESSMENTS } },
    }),
  ]);
  const hasRecommendation =
    snapshot.enrollments.length === 0 && snapshot.latestAttempt
      ? (await prisma.recommendation.count({ where: { userId: user.id, status: "SUGGESTED" } })) > 0
      : false;

  const greeting = t(
    `dashboard.greeting${greetingKey().charAt(0).toUpperCase()}${greetingKey().slice(1)}`,
    { name: user.fullName.split(" ")[0] },
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[26px] font-semibold text-[var(--brand-ink)] sm:text-[30px]">{greeting}</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">
          {user.jobTitle ? `${user.jobTitle}${user.departmentName ? ` · ${user.departmentName}` : ""}` : user.departmentName}
        </p>
      </header>

      {/* The one thing to do next — always the largest control on the page. */}
      <section
        aria-label={t("dashboard.nextBestAction")}
        className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--brand-ink)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
      >
        {/* The mark's sweep, oversized and barely there. Decoration, so hidden
            from assistive technology and flipped with the writing direction. */}
        <svg
          viewBox="0 0 415 654"
          aria-hidden
          className="pointer-events-none absolute -end-8 -top-16 h-[190%] w-auto opacity-[0.07] rtl:-scale-x-100"
        >
          <rect x="0" y="0" width="415" height="143" fill="var(--brand-red-logo)" />
          <path
            d="M6,654 A409,490 0 0 1 415,164 L415,310 C228,324 78,444 6,654 Z"
            fill="var(--brand-red-logo)"
          />
        </svg>

        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              <span className="h-3 w-1 bg-[var(--brand-red-logo)]" aria-hidden />
              {t("dashboard.nextBestAction")}
            </p>
            <h2 className="mt-2.5 text-xl font-semibold leading-snug tracking-[-0.02em] sm:text-[26px]">
              {t(action.titleKey, action.params)}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{t(action.bodyKey, action.params)}</p>
          </div>
          <LinkButton href={action.href} size="lg" className="shrink-0">
            {t("common.continue")}
            <ArrowRight size={18} className="rtl:rotate-180" />
          </LinkButton>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* AI level */}
        <Card className="p-5">
          <p className="section-title">{t("dashboard.yourAiLevel")}</p>
          {level ? (
            <>
              <div className="mt-3">
                <LevelChip code={level.code} name={localized(level, "name", locale)} size="lg" />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--brand-muted)]">
                {localized(level, "description", locale)}
              </p>
              <Link
                href={`/assessment/${snapshot.latestAttempt?.id}/result`}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
              >
                {t("dashboard.viewSkillAnalysis")}
                <ArrowRight size={14} className="rtl:rotate-180" />
              </Link>
            </>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-[var(--brand-muted)]">{t("dashboard.noPathBody")}</p>
              <LinkButton href="/assessments" size="sm" className="mt-4">
                {t("dashboard.noPathCta")}
              </LinkButton>
            </div>
          )}
        </Card>

        {/* Learning path */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("dashboard.yourLearningPath")}
            subtitle={plan?.path?.title ?? snapshot.enrollments[0]?.path?.title ?? undefined}
            action={
              snapshot.enrollments.length > 0 ? (
                <LinkButton href="/learning" variant="secondary" size="sm">
                  {t("nav.myLearning")}
                </LinkButton>
              ) : null
            }
          />
          <div className="px-5 pb-5">
            {snapshot.enrollments.length === 0 ? (
              <div>
                <p className="text-sm text-[var(--brand-muted)]">
                  {hasRecommendation ? t("action.buildPathBody") : t("dashboard.noPathBody")}
                </p>
                <LinkButton
                  href={
                    hasRecommendation && snapshot.latestAttempt
                      ? `/assessment/${snapshot.latestAttempt.id}/result`
                      : "/assessments"
                  }
                  size="sm"
                  className="mt-3"
                >
                  {hasRecommendation ? t("assessment.startPath") : t("dashboard.noPathCta")}
                </LinkButton>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="tabular text-[26px] font-semibold tracking-[-0.02em] text-[var(--brand-ink)]">
                    {totals.pathPercent}%
                  </span>
                  <span className="text-[13px] text-[var(--brand-muted)]">
                    {t("dashboard.completedOf", { done: formatHours(totals.doneHours) })} ·{" "}
                    {t("dashboard.remaining", { time: formatHours(totals.remainingHours) })}
                  </span>
                </div>
                <Progress value={totals.pathPercent} className="mt-3" label={`${totals.pathPercent}%`} />

                {active ? (
                  <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-4">
                    <p className="section-title">{t("dashboard.nextUp")}</p>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--brand-ink)]">
                      {nextLesson?.title ?? active.course.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                      {nextLesson
                        ? `${t("dashboard.lessonOf", { current: nextLesson.index, total: nextLesson.total })} · ${nextLesson.durationMinutes} ${t("common.minutesShort")}`
                        : active.course.provider.name}
                    </p>
                    <LinkButton
                      href={nextLesson ? `/learn/${active.id}/${nextLesson.lessonId}` : `/learning/${active.id}`}
                      size="sm"
                      className="mt-3"
                    >
                      {t("common.continue")}
                    </LinkButton>
                  </div>
                ) : null}

                {plan?.targetDate ? (
                  <p className="mt-4 text-[13px] text-[var(--brand-muted)]">
                    {t("dashboard.planPace", { hours: plan.hoursPerWeek })} ·{" "}
                    {t("dashboard.planTarget", { date: formatDate(plan.targetDate, locale) })}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </Card>
      </div>

      <section aria-label={t("dashboard.yourProgress")}>
        <h2 className="section-title mb-3">{t("dashboard.yourProgress")}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={t("dashboard.coursesLabel")}
            value={`${totals.coursesDone} / ${totals.coursesTotal}`}
            icon={<BookOpen size={15} />}
          />
          <StatCard
            label={t("dashboard.assessmentsLabel")}
            value={`${assessmentsDone} / ${Math.max(assessmentsTotal, assessmentsDone)}`}
            icon={<ClipboardCheck size={15} />}
          />
          <StatCard
            label={t("dashboard.streak")}
            value={t("dashboard.streakDays", { count: totals.streak })}
            icon={<Flame size={15} />}
            tone={totals.streak > 0 ? "brand" : "neutral"}
          />
          <StatCard
            label={t("certificates.title")}
            value={snapshot.certificates.length}
            icon={<Award size={15} />}
          />
        </div>
      </section>

      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="section-title">
            {t("challenges.level", { level: progress.level })} · {t(`challenges.levelName.${progress.level}`)}
          </p>
          <Link href="/challenges" className="text-[13px] text-[var(--brand-info)] underline underline-offset-2">
            {t("challenges.open")}
          </Link>
        </div>
        <Progress
          className="mt-3"
          value={progress.progress * 100}
          label={
            progress.next === null
              ? t("challenges.topLevel")
              : t("challenges.toNext", { points: (progress.next - progress.points).toLocaleString(locale) })
          }
        />
        <p className="tabular mt-2 text-[12px] text-[var(--brand-muted)]">
          {t("challenges.points", { points: progress.points.toLocaleString(locale) })}
          {progress.next !== null
            ? ` · ${t("challenges.toNext", { points: (progress.next - progress.points).toLocaleString(locale) })}`
            : ""}
        </p>
        {snapshot.badges.length > 0 ? (
          <>
          <p className="section-title mt-4">{t("dashboard.recentBadges")}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {snapshot.badges.slice(0, 6).map((b) => (
              <li
                key={b.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-line)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--brand-ink)]"
                title={b.badge.description}
              >
                <Sparkles size={14} className="text-[var(--brand-red)]" aria-hidden />
                {b.badge.name}
              </li>
            ))}
          </ul>
          </>
        ) : null}
      </Card>
    </div>
  );
}
