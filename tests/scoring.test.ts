import { describe, expect, it } from "vitest";
import {
  aggregateByCompetency,
  classifyLevel,
  gradeAnswer,
  nextDifficulty,
  reorderForDifficulty,
  scoreWrittenAnswer,
  strengthsAndGaps,
  weightedTotal,
  DEFAULT_PROMPT_RUBRIC,
  type GradableQuestion,
} from "@/lib/assessment/scoring";

const single: GradableQuestion = {
  id: "q1",
  type: "SINGLE",
  points: 1,
  competencyId: "c-fund",
  options: [
    { id: "a", isCorrect: true },
    { id: "b", isCorrect: false },
    { id: "c", isCorrect: false },
  ],
};

const multi: GradableQuestion = {
  id: "q2",
  type: "MULTI",
  points: 2,
  competencyId: "c-prompt",
  options: [
    { id: "a", isCorrect: true },
    { id: "b", isCorrect: true },
    { id: "c", isCorrect: false },
    { id: "d", isCorrect: false },
  ],
};

const BANDS = [
  { id: "l0", code: "L0", minScore: 0, maxScore: 24.99, order: 0 },
  { id: "l1", code: "L1", minScore: 25, maxScore: 44.99, order: 1 },
  { id: "l2", code: "L2", minScore: 45, maxScore: 64.99, order: 2 },
  { id: "l3", code: "L3", minScore: 65, maxScore: 84.99, order: 3 },
  { id: "l4", code: "L4", minScore: 85, maxScore: 100, order: 4 },
];

describe("grading", () => {
  it("awards full marks for the correct single answer", () => {
    const r = gradeAnswer(single, { questionId: "q1", selectedOptionIds: ["a"] });
    expect(r.score).toBe(1);
    expect(r.isCorrect).toBe(true);
  });

  it("gives nothing for a wrong single answer", () => {
    const r = gradeAnswer(single, { questionId: "q1", selectedOptionIds: ["b"] });
    expect(r.score).toBe(0);
  });

  it("gives nothing for an unanswered question", () => {
    expect(gradeAnswer(single, undefined).score).toBe(0);
  });

  it("gives partial credit on multi-select", () => {
    const r = gradeAnswer(multi, { questionId: "q2", selectedOptionIds: ["a"] });
    expect(r.score).toBe(1);
    expect(r.isCorrect).toBe(false);
  });

  it("penalises wrong picks on multi-select but never below zero", () => {
    const both = gradeAnswer(multi, { questionId: "q2", selectedOptionIds: ["a", "b"] });
    expect(both.score).toBe(2);
    const messy = gradeAnswer(multi, { questionId: "q2", selectedOptionIds: ["a", "c", "d"] });
    expect(messy.score).toBe(0);
    const allWrong = gradeAnswer(multi, { questionId: "q2", selectedOptionIds: ["c", "d"] });
    expect(allWrong.score).toBe(0);
  });

  it("flags written answers for human review", () => {
    const q: GradableQuestion = {
      id: "q3",
      type: "PROMPT_TASK",
      points: 5,
      competencyId: "c-prompt",
      options: [],
      rubric: { criteria: DEFAULT_PROMPT_RUBRIC },
    };
    const r = gradeAnswer(q, { questionId: "q3", textAnswer: "Summarise it." });
    expect(r.needsHumanReview).toBe(true);
    expect(r.feedback).toBeTruthy();
  });
});

describe("written answer rubric", () => {
  it("scores a complete prompt above a thin one", () => {
    const strong = scoreWrittenAnswer(
      `I am a procurement officer at a garment manufacturer. Below are three supplier quotations.
Compare them on unit price, lead time and payment terms, and produce a management summary.
Keep it under 400 words in a table with four sections. Do not include any figure I have not given you.
List anything each quotation does not state, and mark anything you inferred so I can verify it against the source.`,
      DEFAULT_PROMPT_RUBRIC,
    );
    const thin = scoreWrittenAnswer("compare the quotes", DEFAULT_PROMPT_RUBRIC);
    expect(strong.ratio).toBeGreaterThan(thin.ratio);
    expect(strong.ratio).toBeGreaterThan(0.7);
  });

  it("returns zero and a clear message for an empty answer", () => {
    const r = scoreWrittenAnswer("", DEFAULT_PROMPT_RUBRIC);
    expect(r.ratio).toBe(0);
    expect(r.feedback).toContain("No answer");
  });

  it("names what is missing so the feedback is actionable", () => {
    const r = scoreWrittenAnswer("Summarise the attached supplier document for me please now", DEFAULT_PROMPT_RUBRIC);
    expect(r.feedback.toLowerCase()).toContain("add");
  });
});

describe("aggregation and levels", () => {
  const competencies = [
    { id: "c-fund", key: "FUNDAMENTALS", weight: 0.2 },
    { id: "c-prompt", key: "PROMPTING", weight: 0.25 },
  ];

  it("aggregates per competency", () => {
    const results = aggregateByCompetency(
      [
        { questionId: "1", competencyId: "c-fund", score: 1, maxScore: 1, isCorrect: true, needsHumanReview: false },
        { questionId: "2", competencyId: "c-fund", score: 0, maxScore: 1, isCorrect: false, needsHumanReview: false },
        { questionId: "3", competencyId: "c-prompt", score: 2, maxScore: 2, isCorrect: true, needsHumanReview: false },
      ],
      competencies,
    );
    expect(results.find((r) => r.key === "FUNDAMENTALS")?.percentage).toBe(50);
    expect(results.find((r) => r.key === "PROMPTING")?.percentage).toBe(100);
  });

  it("weights competencies rather than counting questions", () => {
    const results = [
      { competencyId: "c-fund", key: "FUNDAMENTALS", rawScore: 10, maxScore: 10, percentage: 100 },
      { competencyId: "c-prompt", key: "PROMPTING", rawScore: 0, maxScore: 2, percentage: 0 },
    ];
    // 100 * 0.2 + 0 * 0.25 over 0.45 = 44.4, not 83 (which raw counting would give).
    expect(weightedTotal(results, competencies)).toBeCloseTo(44.44, 1);
  });

  it("maps a score to the right level band", () => {
    expect(classifyLevel(10, BANDS).code).toBe("L0");
    expect(classifyLevel(30, BANDS).code).toBe("L1");
    expect(classifyLevel(50, BANDS).code).toBe("L2");
    expect(classifyLevel(70, BANDS).code).toBe("L3");
  });

  it("never awards L4 without a passed technical assessment", () => {
    expect(classifyLevel(95, BANDS).code).toBe("L3");
    expect(classifyLevel(95, BANDS, { technicalPassed: true }).code).toBe("L4");
  });

  it("separates strengths from development areas", () => {
    const { strengths, gaps } = strengthsAndGaps([
      { competencyId: "1", key: "FUNDAMENTALS", rawScore: 8, maxScore: 10, percentage: 80 },
      { competencyId: "2", key: "PROMPTING", rawScore: 3, maxScore: 10, percentage: 30 },
      { competencyId: "3", key: "RESPONSIBLE_AI", rawScore: 9, maxScore: 10, percentage: 90 },
    ]);
    expect(strengths.map((s) => s.key)).toContain("RESPONSIBLE_AI");
    expect(gaps.map((g) => g.key)).toContain("PROMPTING");
    expect(gaps.map((g) => g.key)).not.toContain("RESPONSIBLE_AI");
  });
});

describe("adaptive branching", () => {
  it("steps up after three correct in a row", () => {
    expect(nextDifficulty("EASY", [true, true, true])).toBe("MEDIUM");
    expect(nextDifficulty("MEDIUM", [true, true, true])).toBe("ADVANCED");
  });

  it("never steps beyond the hardest band", () => {
    expect(nextDifficulty("ADVANCED", [true, true, true])).toBe("ADVANCED");
  });

  it("steps down after two wrong in a row", () => {
    expect(nextDifficulty("ADVANCED", [false, false])).toBe("MEDIUM");
    expect(nextDifficulty("EASY", [false, false])).toBe("EASY");
  });

  it("holds steady on a mixed run", () => {
    expect(nextDifficulty("MEDIUM", [true, false, true])).toBe("MEDIUM");
  });

  it("moves the remaining questions towards the target difficulty", () => {
    const remaining = [
      { difficulty: "EASY" },
      { difficulty: "ADVANCED" },
      { difficulty: "MEDIUM" },
    ];
    expect(reorderForDifficulty(remaining, "ADVANCED")[0].difficulty).toBe("ADVANCED");
    expect(reorderForDifficulty(remaining, "EASY")[0].difficulty).toBe("EASY");
  });
});
