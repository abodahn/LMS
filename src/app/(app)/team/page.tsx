import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { getTeamStats } from "@/lib/analytics";
import { formatDate, formatHours } from "@/lib/utils";
import { Card, EmptyState, Progress, SectionHeading, StatCard, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { LevelChip } from "@/components/level-chip";
import { LEVEL_CODES } from "@/lib/constants";
import { LEVEL_COLORS } from "@/lib/branding";

export const metadata: Metadata = { title: "My Team" };

export default async function TeamPage() {
  const user = await requirePermission("team.view");
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const stats = await getTeamStats(user.id, locale);

  if (stats.totals.size === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading title={t("manager.title")} subtitle={t("manager.subtitle")} />
        <EmptyState title={t("manager.noTeam")} body={t("manager.noTeamBody")} icon={<Users size={20} />} />
      </div>
    );
  }

  const maxLevel = Math.max(1, ...Object.values(stats.distribution));

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("manager.title")}
        subtitle={t("manager.subtitle")}
        action={
          stats.totals.pendingReviews > 0 ? (
            <LinkButton href="/team/reviews" size="sm">
              {t("manager.reviewQueue")} ({stats.totals.pendingReviews})
            </LinkButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label={t("manager.teamSize")} value={stats.totals.size} icon={<Users size={15} />} />
        <StatCard
          label={t("manager.participation")}
          value={`${stats.totals.participation}%`}
          hint={`${stats.totals.assessed} / ${stats.totals.size}`}
          icon={<CheckCircle2 size={15} />}
        />
        <StatCard
          label={t("manager.averageLevel")}
          value={`L${Math.round(stats.totals.averageLevel)}`}
          hint={stats.totals.averageLevel.toFixed(1)}
          icon={<TrendingUp size={15} />}
        />
        <StatCard label={t("manager.completionRate")} value={`${stats.totals.completionRate}%`} />
        <StatCard
          label={t("manager.learningHours")}
          value={formatHours(stats.totals.learningHours)}
          icon={<Clock size={15} />}
        />
        <StatCard
          label={t("manager.overdue")}
          value={stats.totals.overdue}
          tone={stats.totals.overdue > 0 ? "warning" : "neutral"}
          icon={<AlertTriangle size={15} />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("manager.levelDistribution")}</h2>
          <ul className="mt-4 space-y-2.5">
            {LEVEL_CODES.map((code) => {
              const count = stats.distribution[code];
              return (
                <li key={code} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-[13px] font-semibold text-[var(--brand-ink)]">{code}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--brand-canvas)]">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${(count / maxLevel) * 100}%`, background: LEVEL_COLORS[code] }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-end text-[13px] tabular-nums text-[var(--brand-muted)]">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("manager.topGaps")}</h2>
          {stats.gaps.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("common.noResults")}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.gaps.map((g) => (
                <li key={g.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium text-[var(--brand-ink)]">{g.name}</span>
                    <span className="text-[13px] tabular-nums text-[var(--brand-muted)]">{g.average}%</span>
                  </div>
                  <Progress
                    value={g.average}
                    className="mt-1.5"
                    label={`${g.name}: ${g.average}%`}
                    tone={g.average < 50 ? "brand" : "ink"}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section>
        <h2 className="section-title mb-3">{t("manager.teamMembers")}</h2>
        <TableShell>
          <thead>
            <tr>
              <th>{t("common.employee")}</th>
              <th>{t("common.level")}</th>
              <th>{t("common.progress")}</th>
              <th>{t("common.courses")}</th>
              <th>{t("manager.learningHours")}</th>
              <th>{t("manager.lastActive")}</th>
              <th className="text-end">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {stats.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="block font-medium text-[var(--brand-ink)]">{r.fullName}</span>
                  <span className="block text-[12px] text-[var(--brand-muted)]">
                    {r.jobTitle ?? r.employeeCode}
                  </span>
                </td>
                <td>
                  {r.levelCode ? (
                    <LevelChip code={r.levelCode} name={r.levelName ?? undefined} size="sm" />
                  ) : (
                    <span className="text-[13px] text-[var(--brand-muted)]">{t("common.notStarted")}</span>
                  )}
                </td>
                <td className="min-w-32">
                  <Progress value={r.progress} label={`${r.progress}%`} />
                  <span className="mt-1 block text-[12px] text-[var(--brand-muted)]">{r.progress}%</span>
                </td>
                <td className="tabular-nums">
                  {r.coursesDone} / {r.courses}
                </td>
                <td className="tabular-nums">{formatHours(r.learningMinutes / 60)}</td>
                <td className="text-[13px] text-[var(--brand-muted)]">
                  {r.lastActive ? formatDate(r.lastActive, locale) : t("common.notAvailable")}
                </td>
                <td className="text-end">
                  <Link
                    href={`/team/${r.id}`}
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

      <p className="text-[12px] text-[var(--brand-muted)]">{t("manager.subtitle")}</p>
    </div>
  );
}
