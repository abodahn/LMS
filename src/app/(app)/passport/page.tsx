import type { Metadata } from "next";
import { Award, BookOpen, Clock, Sparkles, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { getLearnerSnapshot } from "@/lib/learner";
import { strengthsAndGaps } from "@/lib/assessment/scoring";
import { formatDate, formatHours, parseJson } from "@/lib/utils";
import type { Locale } from "@/lib/constants";
import { Card, EmptyState, SectionHeading, StatCard, StatusPill } from "@/components/ui/primitives";
import { LevelChip } from "@/components/level-chip";
import { BeforeAfter } from "@/components/before-after";

export const metadata: Metadata = { title: "AI Skill Passport" };

export default async function PassportPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const snapshot = await getLearnerSnapshot(user.id);

  const [attempts, capstones, history] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: { userId: user.id, status: "GRADED" },
      orderBy: { submittedAt: "asc" },
      include: { definition: true, level: true, scores: { include: { competency: true } } },
    }),
    prisma.assignmentSubmission.findMany({
      where: { userId: user.id, assignment: { type: "CAPSTONE" } },
      include: { assignment: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.historicalTraining.findMany({ where: { userId: user.id }, orderBy: { completedAt: "desc" } }),
  ]);

  const baseline = attempts.find((a) => a.isBaseline) ?? attempts[0];
  const latest = [...attempts].reverse().find((a) => a.definition.type === "PLACEMENT" || a.definition.type === "FINAL");
  const hasGrowth = !!baseline && !!latest && baseline.id !== latest.id;

  const scores = (latest?.scores ?? []).map((s) => ({
    competencyId: s.competencyId,
    key: s.competency.key,
    name: localized(s.competency, "name", locale),
    rawScore: s.rawScore,
    maxScore: s.maxScore,
    percentage: s.percentage,
  }));
  const { strengths } = strengthsAndGaps(scores);

  const completed = snapshot.enrollments.filter((e) => e.status === "COMPLETED");
  const totalHours =
    completed.reduce((s, e) => s + e.course.estimatedHours, 0) + history.reduce((s, h) => s + h.hours, 0);

  const nextTarget = snapshot.level
    ? parseJson<string[]>(
        (await prisma.skillLevel.findFirst({ where: { order: snapshot.level.order + 1 } }))?.focusAreas ?? "[]",
        [],
      )
    : [];

  return (
    <div className="space-y-6">
      <SectionHeading title={t("passport.title")} subtitle={t("passport.subtitle")} />

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--brand-ink)]">{user.fullName}</h2>
            <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
              {user.jobTitle ?? "—"}
              {user.departmentName ? ` · ${user.departmentName}` : ""} · {user.employeeCode}
            </p>
            <div className="mt-4">
              <p className="section-title">{t("passport.currentLevel")}</p>
              <div className="mt-1.5">
                {snapshot.level ? (
                  <LevelChip
                    code={snapshot.level.code}
                    name={localized(snapshot.level, "name", locale)}
                    size="lg"
                  />
                ) : (
                  <p className="text-sm text-[var(--brand-muted)]">{t("common.notAvailable")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:max-w-md sm:flex-1 lg:grid-cols-3">
            <StatCard label={t("passport.learningHours")} value={formatHours(totalHours)} icon={<Clock size={15} />} />
            <StatCard label={t("passport.certificatesCount")} value={snapshot.certificates.length} icon={<Award size={15} />} />
            <StatCard label={t("passport.completedCourses")} value={completed.length} icon={<BookOpen size={15} />} />
          </div>
        </div>

        {strengths.length > 0 ? (
          <div className="mt-6 border-t border-[var(--brand-line)] pt-4">
            <p className="section-title">{t("passport.primaryStrengths")}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {strengths.map((s) => (
                <li
                  key={s.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-line)] px-3 py-1 text-[13px] font-medium text-[var(--brand-ink)]"
                >
                  <Sparkles size={13} className="text-[var(--brand-red)]" aria-hidden />
                  {scores.find((x) => x.key === s.key)?.name ?? s.key}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {nextTarget.length > 0 ? (
          <div className="mt-4 border-t border-[var(--brand-line)] pt-4">
            <p className="section-title">{t("passport.nextTarget")}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {nextTarget.map((a) => (
                <li key={a} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--brand-charcoal)]">
                  <Target size={13} className="text-[var(--brand-muted)]" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.skillGrowth")}</h2>
        {hasGrowth ? (
          <div className="mt-4">
            <BeforeAfter
              before={{ overall: baseline.percentage, scores: toMap(baseline.scores, locale) }}
              after={{ overall: latest.percentage, scores: toMap(latest.scores, locale) }}
              labels={{
                before: t("passport.before"),
                after: t("passport.after"),
                improvement: t("passport.improvement"),
              }}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("passport.noBaseline")}</p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.assessmentHistory")}</h2>
          {attempts.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("common.noResults")}</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {[...attempts].reverse().map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-medium text-[var(--brand-ink)]">
                      {localized(a.definition, "title", locale)}
                    </span>
                    <span className="text-[var(--brand-muted)]">{formatDate(a.submittedAt, locale)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {a.level ? <LevelChip code={a.level.code} size="sm" /> : null}
                    <span className="tabular-nums text-[var(--brand-ink)]">{Math.round(a.percentage)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.capstones")}</h2>
          {capstones.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("common.noResults")}</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {capstones.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="min-w-0 font-medium text-[var(--brand-ink)]">{c.assignment.title}</span>
                  <span className="flex items-center gap-2">
                    {c.score != null ? <span className="tabular-nums">{Math.round(c.score)}</span> : null}
                    <StatusPill status={c.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.badges")}</h2>
        {snapshot.badges.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("common.noResults")}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {snapshot.badges.map((b) => (
              <li
                key={b.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-line)] bg-white px-3 py-1.5 text-[13px]"
                title={b.badge.description}
              >
                <Award size={14} className="text-[var(--brand-red)]" aria-hidden />
                <span className="font-medium text-[var(--brand-ink)]">{b.badge.name}</span>
                <span className="text-[var(--brand-muted)]">{formatDate(b.earnedAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {history.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("admin.importHistory")}</h2>
          <ul className="mt-3 space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span className="font-medium text-[var(--brand-ink)]">{h.courseName}</span>
                <span className="text-[var(--brand-muted)]">
                  {h.provider ?? "—"} · {formatDate(h.completedAt, locale)} · {formatHours(h.hours)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {attempts.length === 0 && completed.length === 0 ? (
        <EmptyState title={t("passport.noBaseline")} body={t("dashboard.noPathBody")} />
      ) : null}
    </div>
  );
}

function toMap(
  scores: { percentage: number; competency: { key: string; name: string; nameAr: string | null; nameTr: string | null } }[],
  locale: Locale,
) {
  return scores.map((s) => ({ key: s.competency.key, name: localized(s.competency, "name", locale), value: s.percentage }));
}
