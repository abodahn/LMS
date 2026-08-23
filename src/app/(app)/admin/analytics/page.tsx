import type { Metadata } from "next";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { getExecutiveStats } from "@/lib/analytics";
import { formatHours } from "@/lib/utils";
import { Card, SectionHeading, StatCard, TableShell } from "@/components/ui/primitives";
import { LEVEL_CODES } from "@/lib/constants";
import { LEVEL_COLORS } from "@/lib/branding";
import { ReadinessGauge } from "../readiness-gauge";
import { TrendChart } from "./trend-chart";
import { Heatmap } from "./heatmap";
import { DownloadLink } from "@/components/download-link";

export const metadata: Metadata = { title: "Executive dashboard" };

export default async function AnalyticsPage() {
  await requirePermission("analytics.executive");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const stats = await getExecutiveStats(locale);
  const maxLevel = Math.max(1, ...Object.values(stats.distribution));

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("executive.title")}
        action={
          <DownloadLink href="/api/reports/executive" variant="ink">
            <Download size={14} aria-hidden />
            {t("executive.downloadReport")}
          </DownloadLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("executive.totalEmployees")} value={stats.totals.employees} />
        <StatCard
          label={t("executive.assessed")}
          value={stats.totals.assessed}
          hint={`${stats.totals.participation}%`}
        />
        <StatCard label={t("executive.enrolled")} value={stats.totals.enrolled} />
        <StatCard label={t("executive.completion")} value={`${stats.totals.completion}%`} />
        <StatCard label={t("executive.learningHours")} value={formatHours(stats.totals.learningHours)} />
        <StatCard label={t("executive.coursesCompleted")} value={stats.totals.coursesCompleted} />
        <StatCard label={t("executive.certificatesIssued")} value={stats.totals.certificates} />
        <StatCard label={t("executive.inactiveLearners")} value={stats.totals.inactiveLearners} tone={stats.totals.inactiveLearners > 0 ? "warning" : "neutral"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.readinessIndex")}</h2>
          <div className="mt-4">
            <ReadinessGauge
              score={stats.readiness.score}
              components={stats.readiness.components}
              methodologyLabel={t("executive.methodology")}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.skillGrowth")}</h2>
          <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
            Across the {stats.totals.reassessed} employees who have re-assessed. Company average across everyone
            assessed is {stats.totals.averageScoreAllAssessed}.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Figure label={t("executive.averageBaseline")} value={stats.totals.averageBaseline} />
            <Figure label={t("executive.averageCurrent")} value={stats.totals.averageCurrent} />
            <Figure
              label={t("executive.averageImprovement")}
              value={stats.totals.averageImprovement}
              signed
            />
          </div>

          <h3 className="section-title mt-6">{t("admin.levelDistribution")}</h3>
          <ul className="mt-3 space-y-2">
            {LEVEL_CODES.map((code) => (
              <li key={code} className="flex items-center gap-3">
                <span className="w-7 shrink-0 text-[13px] font-semibold text-[var(--brand-ink)]">{code}</span>
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
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.departmentHeatmap")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {t("form.heatmapHint")}
        </p>
        <div className="mt-4">
          <Heatmap
            rows={stats.heatmap.map((d) => ({
              name: d.name,
              headcount: d.headcount,
              assessed: d.assessed,
              scores: d.scores,
            }))}
            competencies={stats.competencies.map((c) => ({ key: c.key, name: c.name }))}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.topStrengths")}</h2>
          <ul className="mt-3 space-y-2">
            {stats.strengths.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="inline-flex items-center gap-2 text-[var(--brand-ink)]">
                  <TrendingUp size={14} className="text-[var(--brand-success)]" aria-hidden />
                  {s.name}
                </span>
                <span className="tabular-nums font-medium">{s.average}%</span>
              </li>
            ))}
          </ul>

          <h3 className="section-title mt-5">{t("executive.criticalGaps")}</h3>
          <ul className="mt-2 space-y-2">
            {stats.gaps.map((g) => (
              <li key={g.key} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="inline-flex items-center gap-2 text-[var(--brand-ink)]">
                  <TrendingDown size={14} className="text-[var(--brand-red)]" aria-hidden />
                  {g.name}
                </span>
                <span className="tabular-nums font-medium">{g.average}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.popularCourses")}</h2>
          <ul className="mt-3 space-y-2">
            {stats.popularCourses.map((p, i) => (
              <li key={p.course?.code ?? `course-${i}`} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-[var(--brand-ink)]">{p.course?.title ?? "—"}</span>
                <span className="shrink-0 tabular-nums text-[var(--brand-muted)]">{p.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.completionTrend")}</h2>
        <div className="mt-4">
          <TrendChart
            completion={stats.trend}
            activity={stats.activity}
            labels={{ completion: t("executive.completionTrend"), activity: t("admin.learningActivity") }}
          />
        </div>
      </Card>

      {stats.inactive.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("executive.inactiveLearners")}</h2>
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.employee")}</th>
                <th>{t("profile.employeeId")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.inactive.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-[var(--brand-ink)]">{u.fullName}</td>
                  <td className="font-mono text-[12px] text-[var(--brand-muted)]">{u.employeeCode}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      ) : null}
    </div>
  );
}

function Figure({ label, value, signed }: { label: string; value: number; signed?: boolean }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          signed ? (value >= 0 ? "text-[var(--brand-success)]" : "text-[var(--brand-red)]") : "text-[var(--brand-ink)]"
        }`}
      >
        {signed && value >= 0 ? "+" : ""}
        {value}
      </p>
    </div>
  );
}
