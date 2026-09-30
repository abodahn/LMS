import { describe, expect, it } from "vitest";
import { canComplete } from "../src/lib/completion-rule";
import { audienceWhere } from "../src/lib/assignments";
import { groupByMonth, type CalendarItem } from "../src/lib/calendar";

/**
 * `canComplete` is the single rule every completion path asks — lessons and
 * SCORM both arrive at it through recalcEnrollmentProgress. If it is wrong, a
 * course that must be demonstrated closes on a video playing to the end, and
 * the training record says something that did not happen.
 */
describe("canComplete", () => {
  it("does not complete below 100%", () => {
    expect(canComplete({ requiresSignOff: false, progressPercent: 99, hasSignOff: false })).toEqual({
      ok: false,
      reason: "progress",
    });
  });

  it("completes an ordinary course at 100%", () => {
    expect(canComplete({ requiresSignOff: false, progressPercent: 100, hasSignOff: false }).ok).toBe(true);
  });

  it("holds a sign-off course open at 100% until somebody has watched it done", () => {
    expect(canComplete({ requiresSignOff: true, progressPercent: 100, hasSignOff: false })).toEqual({
      ok: false,
      reason: "awaiting-sign-off",
    });
  });

  it("completes a sign-off course once it is signed", () => {
    expect(canComplete({ requiresSignOff: true, progressPercent: 100, hasSignOff: true }).ok).toBe(true);
  });

  it("a sign-off does not substitute for the content", () => {
    expect(canComplete({ requiresSignOff: true, progressPercent: 40, hasSignOff: true }).reason).toBe("progress");
  });
});

/**
 * An audience that silently widens is the expensive mistake here: mandatory
 * training reaching two thousand people because a filter came through empty.
 */
describe("audienceWhere", () => {
  it("always excludes leavers and deactivated accounts", () => {
    for (const a of ["EVERYONE", "DEPARTMENT", "JOB_FAMILY", "JOB_TITLE", "LOCATION", "SHIFT"] as const) {
      const where = audienceWhere(a, "x") as Record<string, unknown>;
      expect(where.deletedAt).toBeNull();
      expect(where.status).toBe("ACTIVE");
    }
  });

  it("narrows to exactly the value given", () => {
    expect(audienceWhere("DEPARTMENT", "d1")).toMatchObject({ departmentId: "d1" });
    expect(audienceWhere("JOB_TITLE", "j1")).toMatchObject({ jobTitleId: "j1" });
    expect(audienceWhere("LOCATION", "l1")).toMatchObject({ locationId: "l1" });
    expect(audienceWhere("SHIFT", "B")).toMatchObject({ shift: "B" });
    expect(audienceWhere("JOB_FAMILY", "QUALITY")).toMatchObject({ jobTitle: { jobFamily: "QUALITY" } });
  });

  it("a missing value matches nobody rather than everybody", () => {
    // "" matches no real id; the failure mode being guarded is the key
    // disappearing and the filter becoming the whole company.
    expect(audienceWhere("DEPARTMENT", null)).toMatchObject({ departmentId: "" });
    expect(audienceWhere("SHIFT", undefined)).toMatchObject({ shift: "" });
  });
});

describe("groupByMonth", () => {
  const item = (id: string, iso: string): CalendarItem => ({
    id,
    kind: "DEADLINE",
    at: new Date(iso),
    title: id,
    titleAr: null,
    titleTr: null,
    personId: "p",
    personName: "P",
    href: "/",
    overdue: false,
  });

  it("keeps the incoming order within and across months", () => {
    const groups = groupByMonth([
      item("a", "2026-10-02T10:00:00"),
      item("b", "2026-10-20T10:00:00"),
      item("c", "2026-11-01T10:00:00"),
    ]);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([["a", "b"], ["c"]]);
  });

  it("separates the same month in different years", () => {
    const groups = groupByMonth([item("a", "2026-10-02T10:00:00"), item("b", "2027-10-02T10:00:00")]);
    expect(groups).toHaveLength(2);
  });
});

import { refreshCutoff } from "../src/lib/assignments";

/**
 * The cutoff decides whose training has expired. Thirty-day months made annual
 * training fall due five days early every year; these pin calendar months.
 */
describe("refreshCutoff", () => {
  const at = (iso: string) => new Date(`${iso}T09:00:00Z`);

  it("goes back whole calendar months, not blocks of thirty days", () => {
    expect(refreshCutoff(at("2026-09-30"), 12).toISOString().slice(0, 10)).toBe("2025-09-30");
    expect(refreshCutoff(at("2026-09-30"), 6).toISOString().slice(0, 10)).toBe("2026-03-30");
  });

  it("clamps to the end of a shorter month instead of rolling into the next", () => {
    expect(refreshCutoff(at("2026-03-31"), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(refreshCutoff(at("2028-03-31"), 1).toISOString().slice(0, 10)).toBe("2028-02-29");
  });

  it("crosses year boundaries", () => {
    expect(refreshCutoff(at("2026-01-15"), 3).toISOString().slice(0, 10)).toBe("2025-10-15");
  });
});
