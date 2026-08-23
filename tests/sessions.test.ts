import { describe, expect, it } from "vitest";
import { creditHours } from "../src/lib/session-hours";

/**
 * `creditHours` decides how many hours land on somebody's training record when
 * they are marked present, and there is no screen that shows the arithmetic —
 * an employee just sees a number go up. Worth pinning.
 */
describe("creditHours", () => {
  const at = (h: number, m = 0) => new Date(Date.UTC(2026, 8, 1, h, m));

  it("uses the session's own figure when one is set", () => {
    expect(creditHours({ creditHours: 2.5, startsAt: at(9), endsAt: at(17) })).toBe(2.5);
  });

  it("otherwise falls back to how long the session runs", () => {
    expect(creditHours({ creditHours: null, startsAt: at(9), endsAt: at(12) })).toBe(3);
    expect(creditHours({ creditHours: null, startsAt: at(9), endsAt: at(10, 30) })).toBe(1.5);
  });

  it("rounds to a tenth rather than carrying float noise onto a record", () => {
    expect(creditHours({ creditHours: null, startsAt: at(9), endsAt: at(9, 50) })).toBe(0.8);
  });

  it("never credits negative hours, however the dates were entered", () => {
    expect(creditHours({ creditHours: null, startsAt: at(17), endsAt: at(9) })).toBe(0);
  });

  it("honours an explicit zero — a briefing that carries no credit", () => {
    expect(creditHours({ creditHours: 0, startsAt: at(9), endsAt: at(17) })).toBe(0);
  });
});
