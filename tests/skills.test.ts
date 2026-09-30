import { describe, expect, it } from "vitest";
import { bySeverity, shortlistGaps, rankCourses, type SkillGap } from "../src/lib/skills";

/**
 * A skill gap ends up in a conversation between a manager and the person they
 * manage, and the ordering decides which one of them gets talked about first.
 * None of it is visible as arithmetic on the screen, so it is pinned here.
 */

const gap = (over: Partial<SkillGap> & { name: string; required: number; held: number }): SkillGap => ({
  skillId: over.name,
  key: over.name.toUpperCase(),
  nameAr: null,
  nameTr: null,
  category: "PRODUCTION",
  description: null,
  gap: Math.max(0, over.required - over.held),
  isCritical: false,
  source: null,
  ratedAt: null,
  ratedBy: null,
  ...over,
});

describe("bySeverity", () => {
  it("puts a critical gap above a larger non-critical one", () => {
    const critical = gap({ name: "AQL", required: 4, held: 3, isCritical: true });
    const bigger = gap({ name: "Excel", required: 5, held: 0 });
    expect([bigger, critical].sort(bySeverity)[0]).toBe(critical);
  });

  it("orders equally critical gaps by how far behind they are", () => {
    const small = gap({ name: "A", required: 4, held: 3, isCritical: true });
    const large = gap({ name: "B", required: 5, held: 1, isCritical: true });
    expect([small, large].sort(bySeverity).map((g) => g.name)).toEqual(["B", "A"]);
  });

  it("is stable for two identical gaps, so the list does not reshuffle between loads", () => {
    const b = gap({ name: "Bravo", required: 4, held: 2 });
    const a = gap({ name: "Alpha", required: 4, held: 2 });
    expect([b, a].sort(bySeverity).map((g) => g.name)).toEqual(["Alpha", "Bravo"]);
    expect([a, b].sort(bySeverity).map((g) => g.name)).toEqual(["Alpha", "Bravo"]);
  });
});

describe("shortlistGaps", () => {
  it("keeps every critical gap, however many there are", () => {
    const gaps = Array.from({ length: 6 }, (_, i) =>
      gap({ name: `C${i}`, required: 5, held: 1, isCritical: true }),
    );
    expect(shortlistGaps(gaps)).toHaveLength(6);
  });

  it("caps the non-critical ones at three", () => {
    const gaps = Array.from({ length: 9 }, (_, i) => gap({ name: `N${i}`, required: 4, held: i % 3 }));
    const picked = shortlistGaps(gaps);
    expect(picked).toHaveLength(3);
  });

  it("takes the largest non-critical gaps, not the first three it meets", () => {
    const gaps = [
      gap({ name: "tiny", required: 3, held: 2 }),
      gap({ name: "huge", required: 5, held: 0 }),
      gap({ name: "mid", required: 4, held: 2 }),
      gap({ name: "small", required: 3, held: 1 }),
    ];
    expect(shortlistGaps(gaps).map((g) => g.name)).toEqual(["huge", "mid", "small"]);
  });

  it("does not mutate what it was given", () => {
    const gaps = [gap({ name: "B", required: 4, held: 0 }), gap({ name: "A", required: 5, held: 0 })];
    shortlistGaps(gaps);
    expect(gaps.map((g) => g.name)).toEqual(["B", "A"]);
  });
});

describe("rankCourses", () => {
  const course = (title: string, targetLevel: number, estimatedHours: number, isFree = true) => ({
    title,
    targetLevel,
    estimatedHours,
    isFree,
  });

  it("prefers a course that actually reaches the level, even if it is longer", () => {
    const short = course("short but stops at 2", 2, 1);
    const enough = course("reaches 3", 3, 8);
    expect(rankCourses([short, enough], 3)[0]).toBe(enough);
  });

  it("among courses that reach the level, takes the shortest", () => {
    const long = course("long", 4, 12);
    const brief = course("brief", 3, 2);
    expect(rankCourses([long, brief], 3)[0]).toBe(brief);
  });

  it("breaks a tie on length in favour of the free course, which needs no budget approval", () => {
    const paid = course("paid", 3, 4, false);
    const free = course("free", 3, 4, true);
    expect(rankCourses([paid, free], 3)[0]).toBe(free);
  });

  it("does not mutate what it was given", () => {
    const list = [course("b", 1, 9), course("a", 5, 1)];
    rankCourses(list, 3);
    expect(list.map((c) => c.title)).toEqual(["b", "a"]);
  });
});

import { fold, matchSkills } from "../src/lib/course-skill-map";

/**
 * Each case here was a real false positive or a real miss at nine thousand
 * courses. A wrong match puts an unrelated course at the top of somebody's
 * development plan, because short courses rank first.
 */
describe("matchSkills", () => {
  const skills = (title: string) => matchSkills(title).map((m) => m.skill);

  it("matches whole words, never substrings", () => {
    expect(skills("Enterprise architecture on Azure")).not.toContain("ERP_OPERATION");
    expect(skills("Global ERP implementations")).toContain("ERP_OPERATION");
  });

  it("treats a hyphen as part of the word", () => {
    expect(skills("Pre-production planning for events")).not.toContain("PRODUCTION_SCHEDULING");
  });

  it("does not map vendor product courses to process skills", () => {
    expect(skills("Configure quality control in Dynamics 365 Supply Chain Management")).not.toContain("INLINE_QC");
    expect(skills("Statistical quality control for garment lines")).toContain("INLINE_QC");
  });

  it("still maps tool courses whoever sells them", () => {
    expect(skills("Analyze data in Excel with Copilot on Azure")).toContain("EXCEL");
  });

  it("does not read a job coach as coaching skills", () => {
    expect(skills("The role of the job coach in supported employment")).not.toContain("ON_JOB_TRAINING");
    expect(skills("Coaching and Mentoring for new supervisors")).toContain("ON_JOB_TRAINING");
  });

  it("matches Turkish text written with a capital dotted İ", () => {
    expect(fold("İŞ İNGİLİZCESİ")).toBe("iş ingilizcesi");
    expect(skills("İş İngilizcesi: e-posta ve toplantı")).toContain("BUSINESS_ENGLISH");
  });

  it("matches Arabic phrases", () => {
    expect(skills("تعلم اللغة التركية من الصفر")).toContain("OPERATIONAL_TURKISH");
  });
});
