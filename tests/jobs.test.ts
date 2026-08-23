import { describe, expect, it } from "vitest";
import { isDue } from "../src/lib/jobs";

/**
 * The in-process scheduler ticks four times an hour, so this predicate is what
 * stands between a daily reminder and ninety-six of them. Nobody would spot
 * that quickly in a log.
 */
describe("isDue", () => {
  const now = new Date("2026-08-21T12:00:00Z");

  it("runs a job that has never run", () => {
    expect(isDue(null, 24, now)).toBe(true);
  });

  it("holds a job that ran inside its interval", () => {
    expect(isDue(new Date("2026-08-21T11:00:00Z"), 24, now)).toBe(false);
    expect(isDue(new Date("2026-08-20T12:00:01Z"), 24, now)).toBe(false);
  });

  it("releases it once the interval has elapsed", () => {
    expect(isDue(new Date("2026-08-20T12:00:00Z"), 24, now)).toBe(true);
    expect(isDue(new Date("2026-08-19T00:00:00Z"), 24, now)).toBe(true);
  });

  it("does not fire repeatedly across a tick sequence", () => {
    let last: Date | null = null;
    let fired = 0;
    // Four ticks an hour for three days.
    for (let minute = 0; minute < 3 * 24 * 60; minute += 15) {
      const t = new Date(now.getTime() + minute * 60_000);
      if (isDue(last, 24, t)) {
        fired++;
        last = t;
      }
    }
    expect(fired).toBe(3);
  });
});
