import { describe, expect, it } from "vitest";
import { budgetLevel, monthKey, monthStart } from "../src/lib/ai/budget";
import { costOf, modelFor } from "../src/lib/ai/provider-shared";
import { summarizeUsage, type UsageRow } from "../src/lib/ai/usage";
import { mockReply } from "../src/lib/ai/mock";

/**
 * Cost control is the part of the AI layer that has to be right before any of
 * the rest is switched on: a wrong threshold either blocks people for nothing
 * or lets a bill run past the limit finance agreed to.
 */
describe("budgetLevel", () => {
  it("warns from 80% and stops at 100%", () => {
    expect(budgetLevel(79_999, 100_000)).toBe("ok");
    expect(budgetLevel(80_000, 100_000)).toBe("warning");
    expect(budgetLevel(99_999, 100_000)).toBe("warning");
    expect(budgetLevel(100_000, 100_000)).toBe("exceeded");
  });

  it("treats a zero or negative allowance as spent rather than unlimited", () => {
    expect(budgetLevel(0, 0)).toBe("exceeded");
    expect(budgetLevel(0, -5)).toBe("exceeded");
  });
});

describe("month boundaries", () => {
  it("keys and starts months in UTC, so a budget resets at the same instant everywhere", () => {
    const late = new Date("2026-09-30T23:30:00Z");
    expect(monthKey(late)).toBe("2026-09");
    expect(monthStart(late).toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(monthKey(new Date("2026-10-01T00:00:00Z"))).toBe("2026-10");
  });
});

describe("model routing and cost", () => {
  it("uses a role's own model, falling back to the default when unset or blank", () => {
    const cfg = { model: "default-model", models: { REASONING: "strong-model", TRANSLATION: "  " } };
    expect(modelFor(cfg, "REASONING")).toBe("strong-model");
    expect(modelFor(cfg, "TRANSLATION")).toBe("default-model");
    expect(modelFor(cfg, "FAST")).toBe("default-model");
  });

  it("prices per million tokens, and returns null rather than zero for an unpriced model", () => {
    const prices = { "m": { input: 3, output: 15 } };
    expect(costOf(prices, "m", 1_000_000, 1_000_000)).toBe(18);
    expect(costOf(prices, "m", 500, 100)).toBeCloseTo(0.003);
    expect(costOf(prices, "unknown", 1000, 1000)).toBeNull();
  });
});

describe("summarizeUsage", () => {
  const row = (over: Partial<UsageRow>): UsageRow => ({
    departmentId: "d1",
    userId: "u1",
    feature: "COACH",
    model: "priced",
    calls: 1,
    failures: 0,
    inputTokens: 1000,
    outputTokens: 1000,
    ...over,
  });
  const prices = { priced: { input: 1, output: 1 } };

  it("adds tokens and calls across rows", () => {
    const s = summarizeUsage([row({}), row({ calls: 2, inputTokens: 500, outputTokens: 0 })], prices);
    expect(s.total.tokens).toBe(2500);
    expect(s.total.calls).toBe(3);
  });

  it("marks a slice's cost as partial when some of it is unpriced", () => {
    const s = summarizeUsage([row({}), row({ model: "unpriced" })], prices);
    expect(s.total.partialCost).toBe(true);
    expect(s.total.cost).toBeCloseTo(0.002);
  });

  it("reports an entirely unpriced slice's cost as unknown, not zero", () => {
    const s = summarizeUsage([row({ model: "unpriced", departmentId: "d2" })], prices);
    expect(s.byDepartment.find((d) => d.key === "d2")?.cost).toBeNull();
  });

  it("keeps failed calls visible", () => {
    const s = summarizeUsage([row({ calls: 3, failures: 2 })], prices);
    expect(s.total.failures).toBe(2);
  });

  it("orders slices by tokens, largest first", () => {
    const s = summarizeUsage([row({ departmentId: "small", inputTokens: 1 }), row({ departmentId: "big", inputTokens: 9000 })], prices);
    expect(s.byDepartment[0].key).toBe("big");
  });
});

describe("mockReply", () => {
  it("returns JSON the course builder and quiz generator can parse", () => {
    const outline = JSON.parse(mockReply("COURSE_BUILDER", "s", "p").text);
    expect(outline.modules.length).toBeGreaterThan(0);
    const quiz = JSON.parse(mockReply("QUIZ", "s", "p").text);
    for (const q of quiz.questions) expect(q.options.filter((o: { correct: boolean }) => o.correct)).toHaveLength(1);
  });

  it("reports token counts, so metering is exercised too", () => {
    const r = mockReply("COACH", "system prompt", "a question");
    expect(r.inputTokens).toBeGreaterThan(0);
    expect(r.outputTokens).toBeGreaterThan(0);
  });
});
