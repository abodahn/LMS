import { describe, expect, it } from "vitest";
import { computeQuality, MAX_OBSERVED_WEIGHT, MIN_FEEDBACK, MIN_STARTERS } from "../src/lib/quality";

/**
 * The quality score moves recommendations, so its rule is pinned here: when
 * T&C's own evidence starts to count, how much, and that it never runs away
 * from the curated starting point on thin data.
 */
const inputs = (over: Partial<Parameters<typeof computeQuality>[0]>) => ({
  base: 0.7,
  starters: 0,
  completed: 0,
  feedbackCount: 0,
  feedbackMean: null,
  recommendRate: null,
  ...over,
});

describe("computeQuality", () => {
  it("keeps the curated score when nobody at T&C has taken the course", () => {
    expect(computeQuality(inputs({})).score).toBe(0.7);
  });

  it("ignores completion below the minimum number of starters", () => {
    const r = computeQuality(inputs({ starters: MIN_STARTERS - 1, completed: 0 }));
    expect(r.completionRate).toBeNull();
    expect(r.score).toBe(0.7);
  });

  it("ignores feedback below the minimum number of ratings", () => {
    const r = computeQuality(inputs({ feedbackCount: MIN_FEEDBACK - 1, feedbackMean: 1, recommendRate: 0 }));
    expect(r.feedbackScore).toBeNull();
    expect(r.score).toBe(0.7);
  });

  it("lets a small amount of evidence move the score only a little", () => {
    const r = computeQuality(inputs({ starters: 5, completed: 0 }));
    expect(r.weight).toBeCloseTo(0.06);
    expect(r.score).toBeGreaterThan(0.6);
  });

  it("never lets observed evidence outweigh the curated score beyond the cap", () => {
    const r = computeQuality(inputs({ starters: 1000, completed: 0 }));
    expect(r.weight).toBe(MAX_OBSERVED_WEIGHT);
    expect(r.score).toBeCloseTo(0.7 * (1 - MAX_OBSERVED_WEIGHT));
  });

  it("rewards a course people finish and rate well", () => {
    const r = computeQuality(inputs({ starters: 50, completed: 45, feedbackCount: 20, feedbackMean: 4.6, recommendRate: 0.95 }));
    expect(r.score).toBeGreaterThan(0.8);
  });

  it("is the same answer for the same inputs, so nightly runs do not compound", () => {
    const a = computeQuality(inputs({ starters: 30, completed: 12, feedbackCount: 8, feedbackMean: 3.1, recommendRate: 0.5 }));
    const b = computeQuality(inputs({ starters: 30, completed: 12, feedbackCount: 8, feedbackMean: 3.1, recommendRate: 0.5 }));
    expect(a).toEqual(b);
  });

  it("stays within 0 and 1", () => {
    for (const base of [0, 1]) {
      const r = computeQuality(inputs({ base, starters: 100, completed: 100, feedbackCount: 100, feedbackMean: 5, recommendRate: 1 }));
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});
