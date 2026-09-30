import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";
import { getAiConfig } from "@/lib/ai/provider";
import { budgetLevel, COMPANY_KEY, monthKey, monthStart } from "@/lib/ai/budget";
import { monthlyTokens, summarizeUsage, usageRows, type Slice } from "@/lib/ai/usage";
import { Alert, Card, SectionHeading, StatCard } from "@/components/ui/primitives";
import { BudgetForm, DeleteBudget, ModelsForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "ai.usageTitle") };
}

const n = (v: number) => v.toLocaleString("en");
const money = (v: number | null, partial: boolean) =>
  v === null ? "—" : `${v.toFixed(2)}${partial ? "*" : ""}`;

/**
 * What the AI costs, and the limits on it.
 *
 * Cost control lives here, ahead of any authoring screen, because the roadmap
 * put it first: finance should be able to see what a feature costs before
 * anybody is encouraged to use it.
 */
export default async function AiUsagePage({ searchParams }: PageProps<"/admin/ai">) {
  // Seeing the cost is an executive's; changing the limits is whoever runs the
  // integration. Finance should not need the keys to the AI in order to read
  // what it cost.
  const viewer = await requirePermission("analytics.executive");
  const canManage = viewer.permissions.includes("integrations.manage");
  const params = await searchParams;
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const now = new Date();
  const month = typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthKey(now);
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));

  const [cfg, rows, trend, budgets, departments, users] = await Promise.all([
    getAiConfig(),
    usageRows(from, to),
    monthlyTokens(6, now),
    prisma.aiBudget.findMany({ orderBy: { key: "asc" } }),
    prisma.department
      .findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } })
      .then((d) => localizeNames(d, locale)),
    prisma.user.findMany({ where: { aiUsage: { some: { createdAt: { gte: from, lt: to } } } }, select: { id: true, fullName: true } }),
  ]);

  const summary = summarizeUsage(rows, cfg.prices);
  const deptName = (id: string) => (id === "none" ? t("ai.noDepartment") : (departments.find((d) => d.id === id)?.name ?? id));
  const userName = (id: string) => (id === "none" ? t("ai.system") : (users.find((u) => u.id === id)?.fullName ?? id));

  // Budget usage is always the current month: that is what the limits apply to.
  const currentRows = month === monthKey(now) ? rows : await usageRows(monthStart(now), new Date(now.getTime() + 1));
  const usedFor = (departmentId: string | null) =>
    currentRows
      .filter((r) => departmentId === null || r.departmentId === departmentId)
      .reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);

  const anyUnpriced = [summary.total, ...summary.byModel].some((s) => s.partialCost);

  const table = (title: string, slices: Slice[], label: (key: string) => string) => (
    <Card className="p-0">
      <h2 className="px-5 pt-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">{title}</h2>
      {slices.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--brand-muted)]">{t("common.noResults")}</p>
      ) : (
        <table className="mt-2 w-full text-[13px]">
          <thead>
            <tr className="text-start text-[11px] uppercase tracking-wide text-[var(--brand-muted)]">
              <th className="px-5 py-2 text-start font-medium">{t("ai.name")}</th>
              <th className="px-3 py-2 text-end font-medium">{t("ai.calls")}</th>
              <th className="px-3 py-2 text-end font-medium">{t("ai.tokens")}</th>
              <th className="px-5 py-2 text-end font-medium">{t("ai.cost")}</th>
            </tr>
          </thead>
          <tbody>
            {slices.slice(0, 12).map((s) => (
              <tr key={s.key} className="border-t border-[var(--brand-line)]">
                <td className="px-5 py-2 text-[var(--brand-ink)]">{label(s.key)}</td>
                <td className="px-3 py-2 text-end tabular-nums">
                  {n(s.calls)}
                  {s.failures ? <span className="text-[var(--brand-red)]"> ({n(s.failures)})</span> : null}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">{n(s.tokens)}</td>
                <td className="px-5 py-2 text-end tabular-nums">{money(s.cost, s.partialCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {slices.length > 12 ? (
        <p className="px-5 pb-3 text-[12px] text-[var(--brand-muted)]">{t("ai.moreRows", { count: slices.length - 12 })}</p>
      ) : (
        <div className="pb-2" />
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <SectionHeading title={t("ai.usageTitle")} subtitle={t("ai.usageIntro")} />

      {!cfg.enabled ? <Alert tone="info">{t("ai.notConfigured")}</Alert> : null}

      <form className="flex items-end gap-2" method="get">
        <label className="text-[13px] text-[var(--brand-muted)]">
          <span className="mb-1 block">{t("ai.month")}</span>
          <input type="month" name="month" defaultValue={month} className="field h-9 w-44" />
        </label>
        <button type="submit" className="h-9 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px]">
          {t("common.apply")}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("ai.tokens")} value={n(summary.total.tokens)} />
        <StatCard label={t("ai.totalCalls")} value={n(summary.total.calls)} />
        <StatCard
          label={t("ai.failures")}
          value={n(summary.total.failures)}
          tone={summary.total.failures > 0 ? "warning" : "neutral"}
        />
        <StatCard label={t("ai.cost")} value={money(summary.total.cost, summary.total.partialCost)} />
      </div>
      {anyUnpriced ? (
        <p className="text-[12px] text-[var(--brand-muted)]">{t(canManage ? "ai.unpricedNote" : "ai.unpricedNoteView")}</p>
      ) : null}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("ai.budgets")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("ai.budgetsHint")}</p>
        {budgets.length > 0 ? (
          <ul className="mt-4">
            {budgets.map((b) => {
              const used = usedFor(b.key === COMPANY_KEY ? null : b.departmentId);
              const level = budgetLevel(used, b.monthlyTokens);
              const pct = Math.min(100, Math.round((used / b.monthlyTokens) * 100));
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--brand-line)] py-3 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--brand-ink)]">
                      {b.key === COMPANY_KEY ? t("ai.wholeCompany") : deptName(b.departmentId ?? "none")}
                      {b.hardStop ? (
                        <span className="ms-2 text-[11px] uppercase tracking-wide text-[var(--brand-red)]">
                          {t("ai.hardStop")}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[var(--brand-line)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background:
                            level === "exceeded"
                              ? "var(--brand-red)"
                              : level === "warning"
                                ? "var(--brand-warning)"
                                : "var(--brand-success)",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[12px] tabular-nums text-[var(--brand-muted)]">
                      {n(used)} / {n(b.monthlyTokens)} · {pct}%
                    </p>
                  </div>
                  {canManage ? <DeleteBudget budgetKey={b.key} /> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--brand-muted)]">{t("ai.noBudgets")}</p>
        )}
        {canManage ? <BudgetForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} /> : null}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {table(t("ai.byDepartment"), summary.byDepartment, deptName)}
        {table(t("ai.byFeature"), summary.byFeature, (k) => t(`ai.feature.${k}`))}
        {table(t("ai.byModel"), summary.byModel, (k) => k)}
        {table(t("ai.byUser"), summary.byUser, userName)}
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("ai.trend")}</h2>
        <ul className="mt-3 space-y-2">
          {trend.map((row) => {
            const max = Math.max(1, ...trend.map((r) => r.tokens));
            return (
              <li key={row.month} className="flex items-center gap-3 text-[12px]">
                <span className="w-16 tabular-nums text-[var(--brand-muted)]">{row.month}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--brand-line)]">
                  <span
                    className="block h-full rounded-full bg-[var(--brand-ink)]"
                    style={{ width: `${Math.round((row.tokens / max) * 100)}%` }}
                  />
                </span>
                <span className="w-28 text-end tabular-nums">{n(row.tokens)}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {canManage ? (
        <ModelsForm
          models={cfg.models}
          defaultModel={cfg.model}
          prices={Object.entries(cfg.prices)
            .map(([model, p]) => `${model} = ${p.input} / ${p.output}`)
            .join("\n")}
        />
      ) : null}
    </div>
  );
}
