import { prisma } from "../db";
import { costOf, type ModelPrice } from "./provider-shared";
import { monthStart } from "./budget";

/**
 * What the AI cost, sliced the ways finance asks: by department, by feature,
 * by model, by person.
 *
 * One grouped query per month — distinct (department, user, feature, model)
 * combinations, not individual calls — folded here. Cost appears only where the
 * administrator has entered a price for that model; a slice with any unpriced
 * usage says so rather than presenting a partial figure as the total.
 */

export type UsageRow = {
  departmentId: string | null;
  userId: string | null;
  feature: string;
  model: string;
  calls: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
};

export type Slice = {
  key: string;
  calls: number;
  failures: number;
  tokens: number;
  cost: number | null;
  /** Some of this slice's usage is on a model with no price, so `cost` understates it. */
  partialCost: boolean;
};

export type UsageSummary = {
  total: Slice;
  byDepartment: Slice[];
  byFeature: Slice[];
  byModel: Slice[];
  byUser: Slice[];
};

/** Pure: rows in, slices out. Kept apart from the query so it can be tested. */
export function summarizeUsage(rows: UsageRow[], prices: Record<string, ModelPrice>): UsageSummary {
  const bucket = () => new Map<string, Slice>();
  const add = (map: Map<string, Slice>, key: string, r: UsageRow) => {
    const s = map.get(key) ?? { key, calls: 0, failures: 0, tokens: 0, cost: 0, partialCost: false };
    s.calls += r.calls;
    s.failures += r.failures;
    s.tokens += r.inputTokens + r.outputTokens;
    const c = costOf(prices, r.model, r.inputTokens, r.outputTokens);
    if (c === null) {
      if (r.inputTokens + r.outputTokens > 0) s.partialCost = true;
    } else {
      s.cost = (s.cost ?? 0) + c;
    }
    map.set(key, s);
  };

  const total = bucket();
  const dept = bucket();
  const feature = bucket();
  const model = bucket();
  const user = bucket();
  for (const r of rows) {
    add(total, "total", r);
    add(dept, r.departmentId ?? "none", r);
    add(feature, r.feature, r);
    add(model, r.model, r);
    add(user, r.userId ?? "none", r);
  }

  // A cost that is entirely unpriced is unknown, not zero.
  const finish = (map: Map<string, Slice>) =>
    [...map.values()]
      .map((s) => (s.partialCost && s.cost === 0 ? { ...s, cost: null } : s))
      .sort((a, b) => b.tokens - a.tokens);

  return {
    total: finish(total)[0] ?? { key: "total", calls: 0, failures: 0, tokens: 0, cost: 0, partialCost: false },
    byDepartment: finish(dept),
    byFeature: finish(feature),
    byModel: finish(model),
    byUser: finish(user),
  };
}

export async function usageRows(from: Date, to: Date): Promise<UsageRow[]> {
  const [all, failed] = await Promise.all([
    prisma.aiUsage.groupBy({
      by: ["departmentId", "userId", "feature", "model"],
      where: { createdAt: { gte: from, lt: to } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    prisma.aiUsage.groupBy({
      by: ["departmentId", "userId", "feature", "model"],
      where: { createdAt: { gte: from, lt: to }, ok: false },
      _count: { _all: true },
    }),
  ]);
  const key = (r: { departmentId: string | null; userId: string | null; feature: string; model: string }) =>
    `${r.departmentId}|${r.userId}|${r.feature}|${r.model}`;
  const failures = new Map(failed.map((f) => [key(f), f._count._all]));
  return all.map((r) => ({
    departmentId: r.departmentId,
    userId: r.userId,
    feature: r.feature,
    model: r.model,
    calls: r._count._all,
    failures: failures.get(key(r)) ?? 0,
    inputTokens: r._sum.inputTokens ?? 0,
    outputTokens: r._sum.outputTokens ?? 0,
  }));
}

/** Tokens per month for the last `months` months, oldest first. */
export async function monthlyTokens(months: number, now = new Date()) {
  const out: { month: string; tokens: number; calls: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const from = monthStart(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)));
    const to = monthStart(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1)));
    const agg = await prisma.aiUsage.aggregate({
      where: { createdAt: { gte: from, lt: to } },
      _sum: { inputTokens: true, outputTokens: true },
      _count: { _all: true },
    });
    out.push({
      month: `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`,
      tokens: (agg._sum.inputTokens ?? 0) + (agg._sum.outputTokens ?? 0),
      calls: agg._count._all,
    });
  }
  return out;
}
