import "server-only";
import { prisma } from "../db";
import { parseJson, seededShuffle } from "../utils";
import {
  aggregateByCompetency,
  classifyLevel,
  gradeAnswer,
  nextDifficulty,
  parseCriteria,
  reorderForDifficulty,
  strengthsAndGaps,
  weightedTotal,
  type Difficulty,
  type GradableQuestion,
  type GradedAnswer,
} from "./scoring";
import { awardBadges } from "../badges";
import { generateRecommendations } from "../recommendation/service";
import { notify } from "../notifications";

export class AssessmentError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

/** Which questions a definition draws on: fixed list, or its competency pools. */
async function selectQuestions(definitionId: string) {
  const definition = await prisma.assessmentDefinition.findUniqueOrThrow({
    where: { id: definitionId },
    include: { pools: true, questions: { where: { status: "PUBLISHED" } } },
  });

  if (definition.questions.length > 0) {
    return definition.questions.map((q) => ({ id: q.id, difficulty: q.difficulty }));
  }

  const picked: { id: string; difficulty: string }[] = [];
  const seen = new Set<string>();

  for (const pool of definition.pools) {
    const candidates = await prisma.assessmentQuestion.findMany({
      where: {
        competencyId: pool.competencyId,
        status: "PUBLISHED",
        // Questions bound to a specific definition never leak into pooled ones.
        definitionId: null,
        ...(pool.difficulty ? { difficulty: pool.difficulty } : {}),
        // A pool scoped to a bank draws only from it, so the easy placement
        // questions can never surface in the final exam and vice versa.
        ...(pool.bankId ? { bankId: pool.bankId } : {}),
      },
      select: { id: true, difficulty: true },
    });
    const chosen = candidates
      .filter((c) => !seen.has(c.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, pool.count);
    for (const c of chosen) {
      seen.add(c.id);
      picked.push(c);
    }
  }

  return picked;
}

export async function attemptEligibility(userId: string, definitionId: string) {
  const definition = await prisma.assessmentDefinition.findUniqueOrThrow({ where: { id: definitionId } });
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, definitionId },
    orderBy: { startedAt: "desc" },
  });

  const open = attempts.find((a) => a.status === "IN_PROGRESS");
  const used = attempts.filter((a) => a.status !== "IN_PROGRESS").length;
  const remaining = Math.max(0, definition.maxAttempts - used);

  let cooldownUntil: Date | null = null;
  const last = attempts.find((a) => a.submittedAt);
  if (last?.submittedAt && definition.cooldownMinutes > 0) {
    const until = new Date(last.submittedAt.getTime() + definition.cooldownMinutes * 60000);
    if (until > new Date()) cooldownUntil = until;
  }

  return { definition, open, used, remaining, cooldownUntil, canStart: remaining > 0 && !cooldownUntil };
}

export async function startAttempt(userId: string, definitionId: string) {
  const eligibility = await attemptEligibility(userId, definitionId);
  if (eligibility.open) return eligibility.open;
  if (!eligibility.canStart) {
    throw new AssessmentError("No attempts remaining for this assessment.", "NO_ATTEMPTS");
  }

  const { definition, used } = eligibility;
  const questions = await selectQuestions(definition.id);
  if (questions.length === 0) {
    throw new AssessmentError("This assessment has no questions yet.", "EMPTY");
  }

  const isBaseline =
    definition.type === "PLACEMENT" &&
    (await prisma.assessmentAttempt.count({ where: { userId, isBaseline: true } })) === 0;

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      definitionId: definition.id,
      userId,
      status: "IN_PROGRESS",
      isBaseline,
      expiresAt: new Date(Date.now() + (definition.durationMinutes + 10) * 60000),
      attemptNumber: used + 1,
      maxScore: 0,
    },
  });

  const ordered = definition.randomizeQuestions ? seededShuffle(questions, attempt.id) : questions;

  for (const [i, q] of ordered.entries()) {
    const options = await prisma.questionOption.findMany({
      where: { questionId: q.id },
      select: { id: true },
      orderBy: { order: "asc" },
    });
    const optionOrder = definition.randomizeOptions
      ? seededShuffle(options.map((o) => o.id), `${attempt.id}:${q.id}`)
      : options.map((o) => o.id);

    await prisma.attemptQuestion.create({
      data: { attemptId: attempt.id, questionId: q.id, order: i, optionOrder: JSON.stringify(optionOrder) },
    });
  }

  return attempt;
}

export async function getAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      definition: true,
      level: true,
      answers: true,
      scores: { include: { competency: true } },
      questions: {
        orderBy: { order: "asc" },
        include: {
          question: { include: { options: true, competency: true, rubric: true } },
        },
      },
    },
  });
  if (!attempt || attempt.userId !== userId) return null;
  return attempt;
}

export type AttemptQuestionView = {
  id: string;
  questionId: string;
  order: number;
  type: string;
  text: string;
  points: number;
  competencyName: string;
  options: { id: string; text: string }[];
  selectedOptionIds: string[];
  textAnswer: string | null;
  rubric: { key: string; label: string; description?: string }[] | null;
};

export function toQuestionViews(
  attempt: NonNullable<Awaited<ReturnType<typeof getAttempt>>>,
  locale: string,
): AttemptQuestionView[] {
  const answers = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const pick = (row: Record<string, unknown>, base: string) =>
    (locale === "ar" ? (row[`${base}Ar`] as string) : locale === "tr" ? (row[`${base}Tr`] as string) : null) ||
    (row[base] as string) ||
    "";

  return attempt.questions.map((aq) => {
    const order = parseJson<string[]>(aq.optionOrder, []);
    const byId = new Map(aq.question.options.map((o) => [o.id, o]));
    const options = (order.length ? order.map((id) => byId.get(id)!).filter(Boolean) : aq.question.options).map((o) => ({
      id: o.id,
      text: pick(o as unknown as Record<string, unknown>, "text"),
    }));
    const answer = answers.get(aq.questionId);
    return {
      id: aq.id,
      questionId: aq.questionId,
      order: aq.order,
      type: aq.question.type,
      text: pick(aq.question as unknown as Record<string, unknown>, "text"),
      points: aq.question.points,
      competencyName: pick(aq.question.competency as unknown as Record<string, unknown>, "name"),
      options,
      selectedOptionIds: parseJson<string[]>(answer?.selectedOptionIds, []),
      textAnswer: answer?.textAnswer ?? null,
      rubric: aq.question.rubric ? parseCriteria(aq.question.rubric.criteria) : null,
    };
  });
}

/** Autosave. Never grades — grading happens once, on submit. */
export async function saveAnswer(input: {
  attemptId: string;
  userId: string;
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  currentIndex?: number;
  elapsedSeconds?: number;
}) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: input.attemptId },
    include: { definition: true },
  });
  if (!attempt || attempt.userId !== input.userId) throw new AssessmentError("Not found", "NOT_FOUND");
  if (attempt.status !== "IN_PROGRESS") throw new AssessmentError("Already submitted", "CLOSED");

  await prisma.assessmentAnswer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: input.questionId } },
    update: {
      selectedOptionIds: JSON.stringify(input.selectedOptionIds ?? []),
      textAnswer: input.textAnswer ?? null,
      answeredAt: new Date(),
    },
    create: {
      attemptId: attempt.id,
      questionId: input.questionId,
      selectedOptionIds: JSON.stringify(input.selectedOptionIds ?? []),
      textAnswer: input.textAnswer ?? null,
    },
  });

  await prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      currentIndex: input.currentIndex ?? attempt.currentIndex,
      timeSpentSeconds: input.elapsedSeconds ?? attempt.timeSpentSeconds,
    },
  });

  if (attempt.definition.isAdaptive) await rebalanceAdaptiveOrder(attempt.id);
}

/**
 * Controlled branching: grade what has been answered so far (privately, not
 * stored), then move the remaining questions towards the difficulty that
 * matches how the learner is doing.
 */
async function rebalanceAdaptiveOrder(attemptId: string) {
  const attempt = await prisma.assessmentAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      answers: true,
      questions: { orderBy: { order: "asc" }, include: { question: { include: { options: true } } } },
    },
  });

  const answered = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const outcomes: boolean[] = [];
  let lastDifficulty: Difficulty = "MEDIUM";

  for (const aq of attempt.questions) {
    const a = answered.get(aq.questionId);
    if (!a) break;
    const graded = gradeAnswer(toGradable(aq.question), {
      questionId: aq.questionId,
      selectedOptionIds: parseJson<string[]>(a.selectedOptionIds, []),
      textAnswer: a.textAnswer,
    });
    outcomes.push(graded.score >= graded.maxScore * 0.99);
    lastDifficulty = aq.question.difficulty as Difficulty;
  }

  if (outcomes.length < 3) return;

  const target = nextDifficulty(lastDifficulty, outcomes);
  const answeredCount = outcomes.length;
  const remaining = attempt.questions.slice(answeredCount);
  if (remaining.length < 2) return;

  const reordered = reorderForDifficulty(
    remaining.map((r) => ({ id: r.id, difficulty: r.question.difficulty })),
    target,
  );

  for (const [i, r] of reordered.entries()) {
    await prisma.attemptQuestion.update({ where: { id: r.id }, data: { order: answeredCount + i } });
  }
}

function toGradable(q: {
  id: string;
  type: string;
  points: number;
  competencyId: string;
  options: { id: string; isCorrect: boolean; matchKey: string | null }[];
  rubric?: { criteria: string } | null;
}): GradableQuestion {
  return {
    id: q.id,
    type: q.type,
    points: q.points,
    competencyId: q.competencyId,
    options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, matchKey: o.matchKey })),
    rubric: q.rubric ? { criteria: parseCriteria(q.rubric.criteria) } : null,
  };
}

export async function submitAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      definition: true,
      answers: true,
      questions: { include: { question: { include: { options: true, rubric: true } } } },
    },
  });
  if (!attempt || attempt.userId !== userId) throw new AssessmentError("Not found", "NOT_FOUND");
  if (attempt.status !== "IN_PROGRESS") return attempt;

  const answers = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const graded: GradedAnswer[] = [];

  for (const aq of attempt.questions) {
    const a = answers.get(aq.questionId);
    const result = gradeAnswer(toGradable(aq.question), {
      questionId: aq.questionId,
      selectedOptionIds: parseJson<string[]>(a?.selectedOptionIds, []),
      textAnswer: a?.textAnswer ?? null,
    });
    graded.push(result);

    await prisma.assessmentAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId: aq.questionId } },
      update: {
        isCorrect: result.isCorrect,
        score: result.score,
        maxScore: result.maxScore,
        rubricScores: result.rubricScores ? JSON.stringify(result.rubricScores) : null,
        feedback: result.feedback ?? null,
      },
      create: {
        attemptId: attempt.id,
        questionId: aq.questionId,
        selectedOptionIds: JSON.stringify(a ? parseJson<string[]>(a.selectedOptionIds, []) : []),
        textAnswer: a?.textAnswer ?? null,
        isCorrect: result.isCorrect,
        score: result.score,
        maxScore: result.maxScore,
        rubricScores: result.rubricScores ? JSON.stringify(result.rubricScores) : null,
        feedback: result.feedback ?? null,
      },
    });
  }

  const competencies = await prisma.competency.findMany();
  const results = aggregateByCompetency(
    graded,
    competencies.map((c) => ({ id: c.id, key: c.key, weight: c.weight })),
  );
  const percentage = weightedTotal(
    results,
    competencies.map((c) => ({ id: c.id, key: c.key, weight: c.weight })),
  );

  await prisma.assessmentScore.deleteMany({ where: { attemptId: attempt.id } });
  for (const r of results) {
    await prisma.assessmentScore.create({
      data: {
        attemptId: attempt.id,
        competencyId: r.competencyId,
        rawScore: r.rawScore,
        maxScore: r.maxScore,
        percentage: r.percentage,
      },
    });
  }

  // Level is only assigned by the assessments that measure overall capability.
  let levelId: string | null = null;
  if (attempt.definition.type === "PLACEMENT" || attempt.definition.type === "FINAL") {
    const bands = await prisma.skillLevel.findMany();
    const technicalPassed = !!(await prisma.assessmentAttempt.findFirst({
      where: { userId, passed: true, definition: { type: "TECHNICAL" } },
    }));
    const band = classifyLevel(
      percentage,
      bands.map((b) => ({ id: b.id, code: b.code, minScore: b.minScore, maxScore: b.maxScore, order: b.order })),
      { technicalPassed },
    );
    levelId = band.id;
  }

  const totalScore = graded.reduce((s, g) => s + g.score, 0);
  const maxScore = graded.reduce((s, g) => s + g.maxScore, 0);

  const updated = await prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "GRADED",
      submittedAt: new Date(),
      gradedAt: new Date(),
      totalScore: Math.round(totalScore * 100) / 100,
      maxScore,
      percentage,
      passed: percentage >= attempt.definition.passingScore,
      levelId,
    },
  });

  await awardBadges(userId);

  if (attempt.definition.type === "PLACEMENT") {
    await generateRecommendations(userId);
    await prisma.employeeProfile.updateMany({
      where: { userId, onboardingStep: { in: ["PROFILE", "ASSESSMENT"] } },
      data: { onboardingStep: "GOALS" },
    });
    await notify(userId, {
      category: "ASSESSMENT",
      title: "Your AI assessment results are ready",
      body: "See your level, your strengths and the learning path we built for you.",
      link: `/assessment/${attempt.id}/result`,
    });
  }

  return updated;
}

/** Turns competency gaps into a short, targeted remediation list. */
export async function remediationFor(attemptId: string) {
  const scores = await prisma.assessmentScore.findMany({
    where: { attemptId },
    include: { competency: true },
  });
  const { gaps } = strengthsAndGaps(
    scores.map((s) => ({
      competencyId: s.competencyId,
      key: s.competency.key,
      rawScore: s.rawScore,
      maxScore: s.maxScore,
      percentage: s.percentage,
    })),
  );

  const weak = gaps.filter((g) => g.percentage < 60);
  if (weak.length === 0) return [];

  const lessons = await prisma.courseLesson.findMany({
    where: {
      module: {
        course: {
          isInternal: true,
          competencies: { some: { competency: { key: { in: weak.map((w) => w.key) } } } },
        },
      },
      type: "TEXT",
    },
    include: { module: { include: { course: { include: { competencies: { include: { competency: true } } } } } } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });

  return weak.map((w) => {
    // Prefer lessons from the course that covers this competency most heavily,
    // so a Responsible AI gap does not send someone to a fundamentals lesson.
    const relevance = (courseCompetencies: { competency: { key: string }; weight: number }[]) =>
      courseCompetencies.find((c) => c.competency.key === w.key)?.weight ?? 0;

    const ranked = lessons
      .filter((l) => relevance(l.module.course.competencies) > 0)
      .sort((a, b) => relevance(b.module.course.competencies) - relevance(a.module.course.competencies));

    return {
      competencyKey: w.key,
      percentage: w.percentage,
      lessons: ranked.slice(0, 3).map((l) => ({
        id: l.id,
        title: l.title,
        minutes: l.durationMinutes,
        courseId: l.module.courseId,
        courseTitle: l.module.course.title,
      })),
    };
  });
}
