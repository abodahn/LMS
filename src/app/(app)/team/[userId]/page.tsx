import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDate, formatHours } from "@/lib/utils";
import { Card, Progress, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { LevelChip } from "@/components/level-chip";
import { BeforeAfter } from "@/components/before-after";
import { MemberActions } from "./member-actions";

export const metadata: Metadata = { title: "Team member" };

export default async function TeamMemberPage({ params }: PageProps<"/team/[userId]">) {
  const manager = await requirePermission("team.view");
  const { userId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const member = await prisma.user.findUnique({
    where: { id: userId },
    include: { jobTitle: true, department: true, profile: true, goals: true },
  });
  // A manager sees only their own reports; admins with team.view see everyone.
  const allowed = member && (member.managerId === manager.id || manager.permissions.includes("users.view"));
  if (!member || !allowed) notFound();

  const [attempts, enrollments, certificates, courses] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: { userId, status: "GRADED", definition: { type: { in: ["PLACEMENT", "FINAL"] } } },
      orderBy: { submittedAt: "asc" },
      include: { level: true, definition: true, scores: { include: { competency: true } } },
    }),
    prisma.enrollment.findMany({
      where: { userId, status: { not: "DROPPED" } },
      include: { course: true },
      orderBy: { order: "asc" },
    }),
    prisma.certificate.findMany({ where: { userId, status: "VALID" } }),
    prisma.course.findMany({
      where: { status: "PUBLISHED", stillAvailable: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, estimatedHours: true },
    }),
  ]);

  const baseline = attempts.find((a) => a.isBaseline) ?? attempts[0];
  const latest = attempts.at(-1);
  const hasGrowth = !!baseline && !!latest && baseline.id !== latest.id;

  const totalHours = enrollments.reduce((s, e) => s + e.course.estimatedHours, 0);
  const doneHours = enrollments.reduce((s, e) => s + (e.course.estimatedHours * e.progressPercent) / 100, 0);
  const percent = totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/team"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("manager.title")}
      </Link>

      <SectionHeading
        title={member.fullName}
        subtitle={`${member.jobTitle?.name ?? "—"} · ${member.department ? localized(member.department, "name", locale) : "—"} · ${member.employeeCode}`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <p className="section-title">{t("passport.currentLevel")}</p>
          <div className="mt-2">
            {latest?.level ? (
              <LevelChip code={latest.level.code} name={localized(latest.level, "name", locale)} size="lg" />
            ) : (
              <p className="text-sm text-[var(--brand-muted)]">{t("common.notStarted")}</p>
            )}
          </div>
          <dl className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--brand-muted)]">{t("manager.completionRate")}</dt>
              <dd className="font-medium text-[var(--brand-ink)]">{percent}%</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--brand-muted)]">{t("manager.learningHours")}</dt>
              <dd className="font-medium text-[var(--brand-ink)]">
                {formatHours(enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0) / 60)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--brand-muted)]">{t("certificates.title")}</dt>
              <dd className="font-medium text-[var(--brand-ink)]">{certificates.length}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <p className="section-title">{t("assessment.detailedScores")}</p>
          {latest ? (
            <ul className="mt-3 space-y-2.5">
              {latest.scores.map((s) => (
                <li key={s.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium text-[var(--brand-ink)]">
                      {localized(s.competency, "name", locale)}
                    </span>
                    <span className="text-[13px] tabular-nums text-[var(--brand-muted)]">
                      {Math.round(s.percentage)}%
                    </span>
                  </div>
                  <Progress
                    value={s.percentage}
                    className="mt-1.5"
                    tone={s.percentage >= 70 ? "success" : s.percentage >= 45 ? "ink" : "brand"}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("common.noResults")}</p>
          )}
          <p className="mt-4 text-[12px] text-[var(--brand-muted)]">{t("manager.subtitle")}</p>
        </Card>
      </div>

      {hasGrowth ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.skillGrowth")}</h2>
          <div className="mt-4">
            <BeforeAfter
              before={{
                overall: baseline.percentage,
                scores: baseline.scores.map((s) => ({
                  key: s.competency.key,
                  name: localized(s.competency, "name", locale),
                  value: s.percentage,
                })),
              }}
              after={{
                overall: latest.percentage,
                scores: latest.scores.map((s) => ({
                  key: s.competency.key,
                  name: localized(s.competency, "name", locale),
                  value: s.percentage,
                })),
              }}
              labels={{
                before: t("passport.before"),
                after: t("passport.after"),
                improvement: t("passport.improvement"),
              }}
            />
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("nav.myLearning")}</h2>
        <ul className="mt-3 space-y-2.5">
          {enrollments.length === 0 ? (
            <li className="text-sm text-[var(--brand-muted)]">{t("common.noResults")}</li>
          ) : (
            enrollments.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span className="min-w-0">
                  <span className="block font-medium text-[var(--brand-ink)]">{e.course.title}</span>
                  <span className="text-[var(--brand-muted)]">
                    {formatHours(e.course.estimatedHours)}
                    {e.dueAt ? ` · ${t("learning.expectedCompletion")} ${formatDate(e.dueAt, locale)}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-[var(--brand-muted)]">{Math.round(e.progressPercent)}%</span>
                  <StatusPill status={e.status} />
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>

      <MemberActions
        userId={member.id}
        courses={courses.map((c) => ({ id: c.id, title: c.title, hours: c.estimatedHours }))}
        currentGoals={member.profile?.managerGoals ?? ""}
        enrolledCourseIds={enrollments.map((e) => e.courseId)}
      />
    </div>
  );
}
