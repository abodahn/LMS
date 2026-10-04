import { describe, expect, it } from "vitest";
import { levelFor, metricOf, MIN_GROUP, pointsOf, standings, summarise } from "@/lib/engagement";

const t = { lessons: 3, courses: 1, assessments: 1, badges: 2, activeDays: 4, minutes: 90 };

describe("points and levels", () => {
  it("scores the tally", () => {
    expect(pointsOf(t)).toBe(3 * 2 + 20 + 15 + 2 * 10 + 4);
    expect(metricOf(t, "MINUTES")).toBe(90);
    expect(metricOf(t, "COURSES")).toBe(1);
  });
  it("places points on a level", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, next: 50, progress: 0 });
    expect(levelFor(75)).toMatchObject({ level: 2, floor: 50, next: 150, progress: 0.25 });
    expect(levelFor(5000)).toMatchObject({ level: 6, next: null, progress: 1 });
  });
});

const dept = (id: string, n: number) => Array.from({ length: n }, (_, i) => ({ userId: `${id}${i}`, departmentId: id }));

describe("standings", () => {
  it("ranks departments per person and leaves out small ones", () => {
    const members = [...dept("A", 4), ...dept("B", 3), ...dept("C", MIN_GROUP - 1)];
    const values = new Map([["A0", 40], ["B0", 60], ["C0", 1000]]);
    const ranked = standings(members, values);
    expect(ranked.map((r) => r.departmentId)).toEqual(["B", "A"]);
    expect(ranked[0]).toMatchObject({ members: 3, total: 60, perPerson: 20 });
  });
  it("never publishes a total that includes an unranked department", () => {
    const members = [...dept("A", 4), ...dept("solo", 1)];
    const values = new Map([["A0", 40], ["solo0", 77]]);
    const { total, standings: ranked } = summarise(members, values, false);
    expect(total).toBe(40);
    expect(total! - ranked.reduce((s, r) => s + r.total, 0)).toBe(0);
  });
  it("shows a department challenge total only for a big enough department", () => {
    expect(summarise(dept("A", MIN_GROUP), new Map([["A0", 5]]), true).total).toBe(5);
    expect(summarise(dept("A", MIN_GROUP - 1), new Map([["A0", 5]]), true).total).toBeNull();
  });
});
