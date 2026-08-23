import { parseJson } from "../utils";
import type { LevelCode } from "../constants";

export type GradableOption = { id: string; isCorrect: boolean; matchKey?: string | null };

export type GradableQuestion = {
  id: string;
  type: string;
  points: number;
  competencyId: string;
  options: GradableOption[];
  rubric?: { criteria: RubricCriterion[] } | null;
};

export type RubricCriterion = { key: string; label: string; weight: number; description?: string };

export type SubmittedAnswer = {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
};

export type GradedAnswer = {
  questionId: string;
  competencyId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  rubricScores?: Record<string, number>;
  feedback?: string;
  needsHumanReview: boolean;
};

/**
 * Deterministic grading. Written-answer questions get a transparent rubric
 * heuristic and are flagged `needsHumanReview` so an assessor with
 * `assessments.grade` can override — the AI layer never writes these scores.
 */
export function gradeAnswer(question: GradableQuestion, answer: SubmittedAnswer | undefined): GradedAnswer {
  const max = question.points || 1;
  const base = {
    questionId: question.id,
    competencyId: question.competencyId,
    maxScore: max,
    needsHumanReview: false,
  };

  if (!answer) return { ...base, score: 0, isCorrect: false };

  const selected = new Set(answer.selectedOptionIds ?? []);

  switch (question.type) {
    case "SINGLE":
    case "TRUE_FALSE":
    case "SCENARIO": {
      const correct = question.options.find((o) => o.isCorrect);
      const ok = !!correct && selected.size === 1 && selected.has(correct.id);
      return { ...base, score: ok ? max : 0, isCorrect: ok };
    }

    case "MULTI": {
      const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
      if (correctIds.length === 0) return { ...base, score: 0, isCorrect: false };
      const hits = correctIds.filter((id) => selected.has(id)).length;
      const wrong = [...selected].filter((id) => !correctIds.includes(id)).length;
      // Partial credit, penalised for wrong picks, never below zero.
      const ratio = Math.max(0, (hits - wrong) / correctIds.length);
      return { ...base, score: round2(ratio * max), isCorrect: ratio === 1 };
    }

    case "MATCHING": {
      // selectedOptionIds carries "optionId:matchKey" pairs.
      const pairs = (answer.selectedOptionIds ?? []).map((p) => p.split(":"));
      const total = question.options.filter((o) => o.matchKey).length;
      if (total === 0) return { ...base, score: 0, isCorrect: false };
      const hits = pairs.filter(([optId, key]) => {
        const opt = question.options.find((o) => o.id === optId);
        return opt?.matchKey && opt.matchKey === key;
      }).length;
      const ratio = hits / total;
      return { ...base, score: round2(ratio * max), isCorrect: ratio === 1 };
    }

    case "SHORT_ANSWER":
    case "PROMPT_TASK": {
      const criteria = question.rubric?.criteria ?? DEFAULT_PROMPT_RUBRIC;
      const graded = scoreWrittenAnswer(answer.textAnswer ?? "", criteria);
      return {
        ...base,
        score: round2(graded.ratio * max),
        isCorrect: graded.ratio >= 0.7,
        rubricScores: graded.scores,
        feedback: graded.feedback,
        needsHumanReview: true,
      };
    }

    default:
      return { ...base, score: 0, isCorrect: false };
  }
}

export const DEFAULT_PROMPT_RUBRIC: RubricCriterion[] = [
  { key: "context", label: "Context", weight: 20, description: "Explains the situation and the data involved" },
  { key: "objective", label: "Clear objective", weight: 20, description: "States precisely what the AI must produce" },
  { key: "constraints", label: "Data & constraints", weight: 20, description: "Gives limits, audience, tone or format rules" },
  { key: "output", label: "Expected output", weight: 20, description: "Describes the structure of the answer wanted" },
  { key: "verification", label: "Verification / accuracy", weight: 20, description: "Asks for sources, assumptions or a check step" },
];

const CRITERION_SIGNALS: Record<string, RegExp[]> = {
  context: [/\b(context|background|we are|our (team|company|department)|i am|as a|situation|attached|the (report|file|data|document))\b/i],
  objective: [/\b(compare|summari[sz]e|analy[sz]e|draft|write|create|produce|identify|recommend|evaluate|explain|list|calculate)\b/i],
  constraints: [/\b(only|must|do not|don't|limit|max|maximum|no more than|within|budget|deadline|audience|tone|in \d+|currency|format|criteria|weight)\b/i],
  output: [/\b(table|bullet|section|heading|paragraph|one page|format|structure|columns?|template|executive summary|report)\b/i],
  verification: [/\b(verify|check|source|cite|assumption|confidence|uncertain|if you (are )?not sure|flag|double[- ]check|reference)\b/i],
};

/**
 * Signal-based rubric scoring: each criterion looks for the concrete features
 * we teach in the prompting module. It is explainable and reproducible, and
 * always flagged for human confirmation.
 */
export function scoreWrittenAnswer(text: string, criteria: RubricCriterion[]) {
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const scores: Record<string, number> = {};
  const missing: string[] = [];

  for (const c of criteria) {
    const signals = CRITERION_SIGNALS[c.key];
    let hit = 0;
    if (words >= 5 && signals) hit = signals.some((re) => re.test(clean)) ? 1 : 0;
    else if (words >= 5 && !signals) hit = words >= 25 ? 1 : 0.5;
    // Very short answers cannot satisfy any criterion convincingly.
    if (words < 12) hit = Math.min(hit, 0.5);
    scores[c.key] = Math.round(hit * c.weight);
    if (hit < 1) missing.push(c.label);
  }

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 100;
  const earned = Object.values(scores).reduce((s, v) => s + v, 0);
  const ratio = totalWeight === 0 ? 0 : earned / totalWeight;

  const feedback =
    words === 0
      ? "No answer was given."
      : missing.length === 0
        ? "Strong prompt — it sets context, a clear objective, constraints, the output shape and a verification step."
        : `Good start. To make this stronger, add: ${missing.join(", ").toLowerCase()}.`;

  return { scores, ratio, feedback, wordCount: words };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// --- aggregation -----------------------------------------------------------

export type CompetencyWeight = { id: string; key: string; weight: number };

export type CompetencyResult = {
  competencyId: string;
  key: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
};

export function aggregateByCompetency(
  graded: GradedAnswer[],
  competencies: CompetencyWeight[],
): CompetencyResult[] {
  return competencies
    .map((c) => {
      const rows = graded.filter((g) => g.competencyId === c.id);
      const raw = rows.reduce((s, r) => s + r.score, 0);
      const max = rows.reduce((s, r) => s + r.maxScore, 0);
      return {
        competencyId: c.id,
        key: c.key,
        rawScore: round2(raw),
        maxScore: round2(max),
        percentage: max === 0 ? 0 : round2((raw / max) * 100),
      };
    })
    .filter((r) => r.maxScore > 0);
}

/**
 * Overall score weights each competency by its configured share, so a long
 * competency does not silently dominate the result.
 */
export function weightedTotal(results: CompetencyResult[], competencies: CompetencyWeight[]): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const r of results) {
    const w = competencies.find((c) => c.id === r.competencyId)?.weight ?? 0;
    if (w <= 0) continue;
    weighted += r.percentage * w;
    totalWeight += w;
  }
  if (totalWeight === 0) {
    const max = results.reduce((s, r) => s + r.maxScore, 0);
    const raw = results.reduce((s, r) => s + r.rawScore, 0);
    return max === 0 ? 0 : round2((raw / max) * 100);
  }
  return round2(weighted / totalWeight);
}

export type LevelBand = { id: string; code: string; minScore: number; maxScore: number; order: number };

/**
 * L4 means demonstrated technical capability, so the general assessment alone
 * can never award it — it caps at L3 until the technical track is passed.
 */
export function classifyLevel(
  percentage: number,
  bands: LevelBand[],
  opts: { technicalPassed?: boolean } = {},
): LevelBand {
  const sorted = [...bands].sort((a, b) => a.order - b.order);
  let match =
    sorted.find((b) => percentage >= b.minScore && percentage <= b.maxScore) ?? sorted[0];
  if (match.code === "L4" && !opts.technicalPassed) {
    match = sorted.find((b) => b.code === "L3") ?? match;
  }
  return match;
}

export function strengthsAndGaps(results: CompetencyResult[]) {
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  const strengths = sorted.filter((r) => r.percentage >= 60).slice(0, 3);
  const gaps = [...sorted].reverse().filter((r) => r.percentage < 70).slice(0, 3);
  return { strengths, gaps };
}

// --- adaptive branching ----------------------------------------------------

const DIFFICULTY_ORDER = ["EASY", "MEDIUM", "ADVANCED"] as const;
export type Difficulty = (typeof DIFFICULTY_ORDER)[number];

/**
 * Controlled branching (requirement: adaptive-ready, not confusing).
 * Three correct in a row steps difficulty up; two wrong in a row steps down.
 */
export function nextDifficulty(current: Difficulty, recentOutcomes: boolean[]): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  const last3 = recentOutcomes.slice(-3);
  const last2 = recentOutcomes.slice(-2);
  if (last3.length === 3 && last3.every(Boolean)) {
    return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
  }
  if (last2.length === 2 && last2.every((v) => !v)) {
    return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
  }
  return current;
}

/** Reorders the *remaining* questions towards the target difficulty. */
export function reorderForDifficulty<T extends { difficulty: string }>(
  remaining: T[],
  target: Difficulty,
): T[] {
  const rank = (d: string) => Math.abs(DIFFICULTY_ORDER.indexOf(d as Difficulty) - DIFFICULTY_ORDER.indexOf(target));
  return [...remaining].sort((a, b) => rank(a.difficulty) - rank(b.difficulty));
}

export function levelCodeOf(band: { code: string }): LevelCode {
  return band.code as LevelCode;
}

export function parseCriteria(raw: string | null | undefined): RubricCriterion[] {
  return parseJson<RubricCriterion[]>(raw, DEFAULT_PROMPT_RUBRIC);
}
