import { describe, expect, it } from "vitest";
import { feederIds, nextStepIds, rankCandidates, type Candidate } from "@/lib/careers";

const steps = [
  { pathId: "prod", jobTitleId: "op", order: 0 },
  { pathId: "prod", jobTitleId: "senior", order: 1 },
  { pathId: "prod", jobTitleId: "leader", order: 2 },
  { pathId: "qa", jobTitleId: "senior", order: 0 },
  { pathId: "qa", jobTitleId: "inspector", order: 1 },
];

describe("ladders", () => {
  it("finds the next rung on every ladder a title is on", () => {
    expect(nextStepIds(steps, "senior").sort()).toEqual(["inspector", "leader"]);
    expect(nextStepIds(steps, "leader")).toEqual([]);
    expect(nextStepIds(steps, "unknown")).toEqual([]);
  });
  it("finds the rung below", () => {
    expect(feederIds(steps, "leader")).toEqual(["senior"]);
    expect(feederIds(steps, "inspector")).toEqual(["senior"]);
    expect(feederIds(steps, "op")).toEqual([]);
  });
});

describe("rankCandidates", () => {
  const c = (fullName: string, readiness: number | null, criticalGaps = 0, unrated = 0): Candidate => ({
    userId: fullName, fullName, currentTitle: null, readiness, gaps: 0, criticalGaps, unrated, openGoals: 0,
  });
  it("orders by readiness, then critical gaps, then unrated, then name", () => {
    const ranked = rankCandidates([c("Zed", 0.5), c("Amy", 0.5), c("Bob", 0.8, 2), c("Cy", 0.8, 1), c("Di", null), c("Ed", 0.5, 0, 3)]);
    expect(ranked.map((x) => x.fullName)).toEqual(["Cy", "Bob", "Amy", "Zed", "Ed", "Di"]);
  });
});
