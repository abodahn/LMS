import { prisma } from "../db";
import { notifyTranslated } from "../notifications";

/**
 * Monthly AI allowances, and telling somebody before they run out.
 *
 * Built before any authoring feature, on purpose: an authoring tool without a
 * meter is a bill nobody predicted. Every call is checked against the company
 * allowance and the caller's department allowance. A budget set to hard-stop
 * refuses the call at its limit; one that is not only warns.
 *
 * The limits themselves are an administrator's to set. Nothing here has a
 * default allowance — a number the system made up would be a number finance
 * never agreed to.
 */

export const COMPANY_KEY = "COMPANY";
export const departmentKey = (departmentId: string) => `DEPT:${departmentId}`;

/** "2026-09" — the unit budgets reset on and alerts are de-duplicated by. */
export function monthKey(at: Date): string {
  return `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthStart(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
}

export type BudgetLevel = "ok" | "warning" | "exceeded";

/**
 * Where a budget stands. Pure, and the only place the thresholds live.
 *
 * 80% is the warning line because at a steady rate it leaves roughly a week of
 * the month — enough time for somebody to decide whether to raise the limit
 * before anything stops.
 */
export function budgetLevel(used: number, limit: number): BudgetLevel {
  if (limit <= 0) return "exceeded";
  if (used >= limit) return "exceeded";
  if (used >= limit * 0.8) return "warning";
  return "ok";
}

export class AiBudgetExceededError extends Error {
  constructor(public readonly scope: "COMPANY" | "DEPARTMENT") {
    super(`AI budget exceeded (${scope})`);
  }
}

async function tokensSince(since: Date, departmentId?: string) {
  const agg = await prisma.aiUsage.aggregate({
    where: { createdAt: { gte: since }, ...(departmentId ? { departmentId } : {}) },
    _sum: { inputTokens: true, outputTokens: true },
  });
  return (agg._sum.inputTokens ?? 0) + (agg._sum.outputTokens ?? 0);
}

/** The budgets that apply to a call from this department, company first. */
async function applicableBudgets(departmentId: string | null) {
  const keys = [COMPANY_KEY, ...(departmentId ? [departmentKey(departmentId)] : [])];
  return prisma.aiBudget.findMany({ where: { key: { in: keys } } });
}

/**
 * Refuses the call if a hard-stop budget it falls under is already spent.
 *
 * Checked before the call rather than after: the point of a hard stop is that
 * the money is not spent, and "you went over, here is the answer anyway" is a
 * warning with extra steps.
 */
export async function assertWithinBudget(departmentId: string | null, now = new Date()) {
  const budgets = (await applicableBudgets(departmentId)).filter((b) => b.hardStop);
  if (budgets.length === 0) return;
  const since = monthStart(now);
  for (const b of budgets) {
    const used = await tokensSince(since, b.key === COMPANY_KEY ? undefined : (b.departmentId ?? undefined));
    if (budgetLevel(used, b.monthlyTokens) === "exceeded") {
      throw new AiBudgetExceededError(b.key === COMPANY_KEY ? "COMPANY" : "DEPARTMENT");
    }
  }
}

/**
 * After a call: tell the people who hold the budget when it crosses 80% and
 * when it is spent. Once per threshold per month — the month is written on the
 * budget, so a busy afternoon does not produce a hundred copies.
 */
export async function alertOnThresholds(departmentId: string | null, now = new Date()) {
  const budgets = await applicableBudgets(departmentId);
  if (budgets.length === 0) return;
  const month = monthKey(now);
  const since = monthStart(now);

  for (const b of budgets) {
    const used = await tokensSince(since, b.key === COMPANY_KEY ? undefined : (b.departmentId ?? undefined));
    const level = budgetLevel(used, b.monthlyTokens);
    const fire100 = level === "exceeded" && b.alerted100 !== month;
    const fire80 = level !== "ok" && b.alerted80 !== month;
    if (!fire100 && !fire80) continue;

    await prisma.aiBudget.update({
      where: { id: b.id },
      data: { ...(fire80 ? { alerted80: month } : {}), ...(fire100 ? { alerted100: month } : {}) },
    });

    const department = b.departmentId
      ? await prisma.department.findUnique({ where: { id: b.departmentId }, select: { name: true, nameAr: true, nameTr: true } })
      : null;
    const holders = await prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        roles: { some: { role: { permissions: { some: { permission: { key: "integrations.manage" } } } } } },
      },
      select: { id: true },
    });
    for (const h of holders) {
      await notifyTranslated(h.id, {
        category: "SYSTEM",
        titleKey: fire100 ? "notify.aiBudgetSpentTitle" : "notify.aiBudgetWarningTitle",
        bodyKey: b.hardStop && fire100 ? "notify.aiBudgetStoppedBody" : "notify.aiBudgetBody",
        params: {
          scope: department ? { row: department, field: "name" } : "T&C",
          used: used.toLocaleString("en"),
          limit: b.monthlyTokens.toLocaleString("en"),
          month,
        },
        link: "/admin/ai",
      });
    }
  }
}
