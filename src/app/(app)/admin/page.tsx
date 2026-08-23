import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, ClipboardCheck, Gauge, TriangleAlert, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { getCourseEffectiveness, getExecutiveStats } from "@/lib/analytics";
import { formatDate, formatHours } from "@/lib/utils";
import { Card, SectionHeading, StatCard, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { LEVEL_CODES } from "@/lib/constants";
import { LEVEL_COLORS } from "@/lib/branding";
import { ReadinessGauge } from "./readiness-gauge";
import { localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminDashboardPage() {
  await requirePermission("users.view");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [stats, courses, pendingProofs, pendingReviews] = await Promise.all([
    getExecutiveStats(locale),
    getCourseEffectiveness(locale),
    prisma.externalCompletionProof.count({ where: { status: "PENDING" } }),
    prisma.assignmentSubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
  ]);

  const needsReview = courses.filter((c) => c.needsReview);
  const maxLevel = Math.max(1, ...Object.values(stats.distribution));

  const attention = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      attempts: { none: { status: "GRADED" } },
    },
    include: { department: true },
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <SectionHeading title={t("admin.dashboard")} subtitle={t("executive.title")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("common.employees")} value={stats.totals.employees} icon={<Users size={15} />} />
        <StatCard
          label={t("admin.assessmentParticipation")}
          value={`${stats.totals.participation}%`}
          hint={`${stats.totals.assessed} / ${stats.totals.employees}`}
          icon={<ClipboardCheck size={15} />}
        />
        <StatCard
          label={t("admin.activeLearners")}
          value={stats.totals.enrolled}
          hint={`${stats.totals.inactiveLearners} inactive`}
          icon={<BookOpen size={15} />}
        />
        <StatCard label={t("executive.completion")} value={`${stats.totals.completion}%`} />
        <StatCard
          label={t("executive.certificatesIssued")}
          value={stats.totals.certificates}
          icon={<Award size={15} />}
        />
        <StatCard label={t("executive.learningHours")} value={formatHours(stats.totals.learningHours)} />
        <StatCard
          label={t("admin.needsReview")}
          value={needsReview.length}
          tone={needsReview.length > 0 ? "warning" : "neutral"}
          icon={<TriangleAlert size={15} />}
        />
        <StatCard
          label={t("manager.reviewQueue")}
          value={pendingReviews + pendingProofs}
          hint={`${pendingReviews} capstones · ${pendingProofs} proofs`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
            <Gauge size={17} className="text-[var(--brand-red)]" aria-hidden />
            {t("executive.readinessIndex")}
          </h2>
          <div className="mt-4">
            <ReadinessGauge score={stats.readiness.score} components={stats.readiness.components} methodologyLabel={t("executive.methodology")} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("admin.levelDistribution")}</h2>
          <ul className="mt-4 space-y-2.5">
            {LEVEL_CODES.map((code) => (
              <li key={code} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-[13px] font-semibold text-[var(--brand-ink)]">{code}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--brand-canvas)]">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(stats.distribution[code] / maxLevel) * 100}%`,
                      background: LEVEL_COLORS[code],
                    }}
                  />
                </span>
                <span className="w-8 shrink-0 text-end text-[13px] tabular-nums text-[var(--brand-muted)]">
                  {stats.distribution[code]}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-[var(--brand-line)] pt-3">
            <LinkButton href="/admin/analytics" variant="secondary" size="sm">
              {t("executive.title")}
            </LinkButton>
          </div>
        </Card>
      </div>

      {needsReview.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("admin.coursesNeedingReview")}</h2>
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.course")}</th>
                <th>{t("common.total")}</th>
                <th>{t("executive.completion")}</th>
                <th>{t("form.lastVerified")}</th>
                <th className="text-end">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {needsReview.slice(0, 8).map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">{c.title}</span>
                    <span className="block text-[12px] text-[var(--brand-muted)]">{c.provider}</span>
                  </td>
                  <td className="tabular-nums">{c.enrolled}</td>
                  <td className="tabular-nums">{c.completionRate}%</td>
                  <td className="text-[13px] text-[var(--brand-muted)]">
                    {c.lastVerifiedAt ? formatDate(c.lastVerifiedAt, locale) : t("common.notAvailable")}
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      {t("common.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      ) : null}

      {attention.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("admin.employeesNeedingAttention")}</h2>
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.employee")}</th>
                <th>{t("common.department")}</th>
                <th>{t("common.status")}</th>
                <th className="text-end">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {attention.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">{u.fullName}</span>
                    <span className="block text-[12px] text-[var(--brand-muted)]">{u.employeeCode}</span>
                  </td>
                  <td>{u.department ? localized(u.department, "name", locale) : "—"}</td>
                  <td className="text-[13px] text-[var(--brand-muted)]">{t("dashboard.noPathTitle")}</td>
                  <td className="text-end">
                    <Link
                      href={`/admin/people/${u.id}`}
                      className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      {t("common.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      ) : null}
    </div>
  );
}
