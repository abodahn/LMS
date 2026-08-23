import { describe, expect, it } from "vitest";
import { applyConstraints, recommend, scoreCourse } from "@/lib/recommendation/engine";
import { DEFAULT_RECOMMENDATION_WEIGHTS } from "@/lib/constants";
import { CATALOG, OPTIONS, learner } from "./fixtures";

const ids = (r: ReturnType<typeof recommend>) => r.selected.map((s) => s.course.id);
const rejectionFor = (r: ReturnType<typeof recommend>, id: string) =>
  r.rejected.find((x) => x.courseId === id)?.reasonCode;

describe("constraints", () => {
  it("removes unpublished and broken courses", () => {
    const { eligible, rejected } = applyConstraints(CATALOG, learner());
    expect(eligible.map((c) => c.id)).not.toContain("archived-course");
    expect(eligible.map((c) => c.id)).not.toContain("dead-link-course");
    expect(rejected.find((r) => r.courseId === "archived-course")?.reasonCode).toBe("NOT_PUBLISHED");
    expect(rejected.find((r) => r.courseId === "dead-link-course")?.reasonCode).toBe("UNAVAILABLE");
  });

  it("never re-recommends a completed course", () => {
    const result = recommend(learner({ completedCourseIds: ["prompting-essentials"] }), CATALOG, OPTIONS);
    expect(ids(result)).not.toContain("prompting-essentials");
    expect(rejectionFor(result, "prompting-essentials")).toBe("COMPLETED");
  });

  it("never recommends a course already on the plan", () => {
    const result = recommend(learner({ activeCourseIds: ["ai-for-finance"] }), CATALOG, OPTIONS);
    expect(ids(result)).not.toContain("ai-for-finance");
    expect(rejectionFor(result, "ai-for-finance")).toBe("ENROLLED");
  });

  it("rejects content far below the demonstrated level", () => {
    const result = recommend(learner({ levelCode: "L3" }), CATALOG, OPTIONS);
    expect(rejectionFor(result, "ai-for-everyone")).toBe("BELOW_LEVEL");
  });

  it("rejects content more than one level above", () => {
    const result = recommend(learner({ levelCode: "L1", isTechnical: true }), CATALOG, OPTIONS);
    expect(rejectionFor(result, "ml-for-everybody")).toBe("TOO_ADVANCED");
  });

  it("keeps technical content away from non-technical employees who did not ask", () => {
    const result = recommend(learner({ levelCode: "L3" }), CATALOG, OPTIONS);
    expect(rejectionFor(result, "ai-for-it")).toBe("TECHNICAL");
  });

  it("allows technical content when the employee asked for programming", () => {
    const result = recommend(learner({ levelCode: "L3", goals: ["PROGRAMMING"] }), CATALOG, OPTIONS);
    expect(rejectionFor(result, "ai-for-it")).not.toBe("TECHNICAL");
  });

  it("always includes mandatory corporate learning", () => {
    const result = recommend(learner({ levelCode: "L3" }), CATALOG, OPTIONS);
    expect(ids(result)).toContain("responsible-ai");
    expect(ids(result)).toContain("ai-at-tc");
  });
});

describe("scoring", () => {
  it("is reproducible for identical input", () => {
    const a = recommend(learner({ jobFamily: "FINANCE" }), CATALOG, OPTIONS);
    const b = recommend(learner({ jobFamily: "FINANCE" }), CATALOG, OPTIONS);
    expect(ids(a)).toEqual(ids(b));
    expect(a.selected.map((s) => s.score)).toEqual(b.selected.map((s) => s.score));
  });

  it("gives every recommendation at least one human-readable reason", () => {
    const result = recommend(learner({ jobFamily: "FINANCE", departmentId: "dept-fin" }), CATALOG, OPTIONS);
    for (const item of result.selected) {
      expect(item.reasons.length).toBeGreaterThan(0);
      for (const reason of item.reasons) expect(reason.label.length).toBeGreaterThan(5);
    }
  });

  it("scores a department-targeted course above an unrelated one", () => {
    const context = learner({ jobFamily: "FINANCE", departmentId: "dept-fin", levelCode: "L2" });
    const finance = scoreCourse(CATALOG.find((c) => c.id === "ai-for-finance")!, context, DEFAULT_RECOMMENDATION_WEIGHTS);
    const production = scoreCourse(
      CATALOG.find((c) => c.id === "ai-for-production")!,
      context,
      DEFAULT_RECOMMENDATION_WEIGHTS,
    );
    expect(finance.score).toBeGreaterThan(production.score);
  });

  it("weights a competency gap: the weaker the score, the stronger the pull", () => {
    const weak = scoreCourse(
      CATALOG.find((c) => c.id === "prompting-essentials")!,
      learner({ competencyScores: { PROMPTING: 15 } }),
      DEFAULT_RECOMMENDATION_WEIGHTS,
    );
    const strong = scoreCourse(
      CATALOG.find((c) => c.id === "prompting-essentials")!,
      learner({ competencyScores: { PROMPTING: 92 } }),
      DEFAULT_RECOMMENDATION_WEIGHTS,
    );
    expect(weak.score).toBeGreaterThan(strong.score);
  });

  it("respects admin weight changes", () => {
    const context = learner({ jobFamily: "FINANCE", departmentId: "dept-fin", levelCode: "L2" });
    const course = CATALOG.find((c) => c.id === "ai-for-finance")!;
    const roleHeavy = scoreCourse(course, context, { ...DEFAULT_RECOMMENDATION_WEIGHTS, ROLE_MATCH: 80 });
    const roleIgnored = scoreCourse(course, context, { ...DEFAULT_RECOMMENDATION_WEIGHTS, ROLE_MATCH: 0 });
    expect(roleHeavy.score).not.toBe(roleIgnored.score);
  });

  it("prefers a course available in the employee's language", () => {
    const arabicOnly = { ...CATALOG.find((c) => c.id === "prompting-essentials")!, language: "ar" };
    const context = learner({ preferredLanguage: "ar" });
    const arabic = scoreCourse(arabicOnly, context, DEFAULT_RECOMMENDATION_WEIGHTS);
    const english = scoreCourse(
      CATALOG.find((c) => c.id === "prompting-essentials")!,
      context,
      DEFAULT_RECOMMENDATION_WEIGHTS,
    );
    expect(arabic.score).toBeGreaterThan(english.score);
  });
});

describe("path assembly", () => {
  it("never exceeds the maximum learning hours", () => {
    const result = recommend(learner({ jobFamily: "FINANCE", departmentId: "dept-fin" }), CATALOG, OPTIONS);
    expect(result.totalHours).toBeLessThanOrEqual(OPTIONS.maxHours);
  });

  it("does not stack two courses covering the same competency", () => {
    const result = recommend(learner({ jobFamily: "FINANCE", departmentId: "dept-fin" }), CATALOG, OPTIONS);
    const dominant = result.selected.map(
      (s) => [...s.course.competencies].sort((a, b) => b.weight - a.weight)[0]?.key,
    );
    // Mandatory courses are exempt from the topic rule.
    const optional = result.selected.filter((s) => !s.forced);
    const optionalTopics = optional.map(
      (s) => [...s.course.competencies].sort((a, b) => b.weight - a.weight)[0]?.key,
    );
    expect(new Set(optionalTopics).size).toBe(optionalTopics.length);
    expect(dominant.length).toBeGreaterThan(0);
  });

  it("orders a prerequisite before the course that needs it", () => {
    const result = recommend(learner({ levelCode: "L0" }), CATALOG, OPTIONS);
    const order = ids(result);
    if (order.includes("generative-ai") && order.includes("ai-for-everyone")) {
      expect(order.indexOf("ai-for-everyone")).toBeLessThan(order.indexOf("generative-ai"));
    }
  });

  it("does not let one long course dominate the path", () => {
    const result = recommend(learner({ levelCode: "L2" }), CATALOG, OPTIONS);
    for (const item of result.selected) {
      if (item.forced) continue;
      expect(item.course.estimatedHours).toBeLessThanOrEqual(OPTIONS.targetHours * 0.6);
    }
  });

  it("expects one level of growth from a full path", () => {
    const result = recommend(learner({ levelCode: "L1", jobFamily: "FINANCE", departmentId: "dept-fin" }), CATALOG, OPTIONS);
    expect(result.totalHours).toBeGreaterThanOrEqual(20);
    expect(result.expectedLevelCode).toBe("L2");
  });
});

// ---------------------------------------------------------------------------
// Acceptance scenarios from the specification
// ---------------------------------------------------------------------------

describe("acceptance scenarios", () => {
  it("A — HR, score 15, non-technical → foundation path, no technical content", () => {
    const result = recommend(
      learner({
        levelCode: "L0",
        jobFamily: "HR",
        departmentId: "dept-hr",
        competencyScores: { FUNDAMENTALS: 18, WORKPLACE: 12, PROMPTING: 10, RESPONSIBLE_AI: 20, DATA_AUTOMATION: 8 },
        goals: ["WRITING"],
      }),
      CATALOG,
      OPTIONS,
    );
    expect(ids(result)).toContain("ai-for-everyone");
    expect(ids(result).some((id) => ["ml-for-everybody", "ai-for-it"].includes(id))).toBe(false);
    expect(result.programTitle).toBe("AI Productivity Foundation");
  });

  it("B — Finance, score 55, strong prompting, weak data → role-relevant productivity path", () => {
    const result = recommend(
      learner({
        levelCode: "L2",
        jobFamily: "FINANCE",
        departmentId: "dept-fin",
        competencyScores: { FUNDAMENTALS: 62, WORKPLACE: 55, PROMPTING: 78, RESPONSIBLE_AI: 60, DATA_AUTOMATION: 22 },
        goals: ["EXCEL", "REPORTS"],
      }),
      CATALOG,
      OPTIONS,
    );
    expect(ids(result)).toContain("ai-for-finance");
    expect(ids(result)).not.toContain("ai-for-production");
    expect(ids(result)).not.toContain("ai-for-hr");
  });

  it("C — IT developer, score 80, technical → technical pathway", () => {
    const result = recommend(
      learner({
        levelCode: "L3",
        jobFamily: "IT",
        departmentId: "dept-it",
        isTechnical: true,
        technicalPassed: true,
        competencyScores: { FUNDAMENTALS: 88, WORKPLACE: 80, PROMPTING: 82, RESPONSIBLE_AI: 76, DATA_AUTOMATION: 84 },
        goals: ["PROGRAMMING", "AUTOMATION"],
      }),
      CATALOG,
      OPTIONS,
    );
    expect(ids(result)).toContain("ai-for-it");
    expect(result.programTitle).toBe("AI Builder Technical Pathway");
  });

  it("D — CEO, score 45 → executive route, never programming", () => {
    const result = recommend(
      learner({
        levelCode: "L2",
        jobFamily: "MANAGEMENT",
        departmentId: "dept-mgt",
        competencyScores: { FUNDAMENTALS: 55, WORKPLACE: 48, PROMPTING: 35, RESPONSIBLE_AI: 52, DATA_AUTOMATION: 30 },
        goals: ["DECISION_MAKING", "RESEARCH"],
      }),
      CATALOG,
      OPTIONS,
    );
    expect(ids(result)).toContain("ai-for-management");
    expect(ids(result)).not.toContain("ml-for-everybody");
    expect(ids(result)).not.toContain("ai-for-it");
    expect(result.programTitle).toBe("AI for Leaders");
  });

  it("E — Production manager, score 30 → foundation plus production focus", () => {
    const result = recommend(
      learner({
        levelCode: "L1",
        jobFamily: "PRODUCTION",
        departmentId: "dept-prd",
        competencyScores: { FUNDAMENTALS: 38, WORKPLACE: 30, PROMPTING: 22, RESPONSIBLE_AI: 34, DATA_AUTOMATION: 20 },
        goals: ["PRODUCTION_IMPROVEMENT", "REPORTS"],
      }),
      CATALOG,
      OPTIONS,
    );
    expect(ids(result)).toContain("ai-for-production");
    expect(ids(result)).toContain("responsible-ai");
    expect(ids(result).some((id) => ["ai-for-everyone", "generative-ai", "prompting-essentials"].includes(id))).toBe(
      true,
    );
    expect(ids(result)).not.toContain("ai-for-finance");
  });
});

describe("level ceiling", () => {
  it("still offers an L0 employee their own role module, which sits at L2", () => {
    const result = recommend(
      learner({
        levelCode: "L0",
        jobFamily: "PRODUCTION",
        departmentId: "dept-prd",
        competencyScores: { FUNDAMENTALS: 20, WORKPLACE: 15, PROMPTING: 8, RESPONSIBLE_AI: 18, DATA_AUTOMATION: 5 },
        goals: ["PRODUCTION_IMPROVEMENT"],
      }),
      CATALOG,
      OPTIONS,
    );
    expect(ids(result)).toContain("ai-for-production");
    // …but never a three-level jump into technical content.
    expect(ids(result)).not.toContain("ml-for-everybody");
    expect(rejectionFor(result, "ml-for-everybody")).toBe("TOO_ADVANCED");
  });

  it("prefers level-appropriate content over the stretch course", () => {
    const context = learner({ levelCode: "L0", jobFamily: "PRODUCTION", departmentId: "dept-prd" });
    const atLevel = scoreCourse(CATALOG.find((c) => c.id === "ai-for-everyone")!, context, DEFAULT_RECOMMENDATION_WEIGHTS);
    const twoAhead = scoreCourse(
      CATALOG.find((c) => c.id === "ai-for-production")!,
      context,
      DEFAULT_RECOMMENDATION_WEIGHTS,
    );
    expect(atLevel.breakdown.find((b) => b.key === "AI_LEVEL_MATCH")!.raw).toBeGreaterThan(
      twoAhead.breakdown.find((b) => b.key === "AI_LEVEL_MATCH")!.raw,
    );
  });
});
