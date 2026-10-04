import { prisma } from "./db";
import { parseJson } from "./utils";

/**
 * Course quality that learns from T&C's own experience of the course.
 *
 * A course starts with the score it was curated or imported with. Once enough
 * T&C employees have taken it, what actually happened is blended in: did people
 * who started it finish, did they find it useful, would they recommend it. The
 * more evidence there is, the more it counts — up to 60%, so one bad cohort
 * cannot sink a course that providers and reviewers rated well.
 *
 * Deterministic and recorded: the inputs behind every score are written to
 * qualityBreakdown, because this number moves recommendations and somebody will
 * eventually ask why a course dropped.
 */

/** Days in progress after which a learner who has not finished counts as not finishing. */
export const STALE_AFTER_DAYS = 60;

/** Below this many starters, completion says more about the few than the course. */
export const MIN_STARTERS = 5;
/** Below this many ratings, an average is an anecdote. */
export const MIN_FEEDBACK = 3;
/** Evidence at which observed signals reach their full weight. */
export const FULL_WEIGHT_AT = 50;
export const MAX_OBSERVED_WEIGHT = 0.6;

export type QualityInputs = {
  /** The curated score this course started from. */
  base: number;
  starters: number;
  completed: number;
  feedbackCount: number;
  /** Mean of usefulness and relevance, each 1–5. */
  feedbackMean: number | null;
  /** Share of feedback that would recommend it. */
  recommendRate: number | null;
};

export type QualityResult = {
  score: number;
  observed: number | null;
  weight: number;
  completionRate: number | null;
  feedbackScore: number | null;
};

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Pure. The whole rule, in one place, so it can be tested and explained. */
export function computeQuality(i: QualityInputs): QualityResult {
  const completionRate = i.starters >= MIN_STARTERS ? i.completed / i.starters : null;
  const feedbackScore =
    i.feedbackCount >= MIN_FEEDBACK && i.feedbackMean !== null
      ? // 1–5 onto 0–1, with the recommend rate counted alongside.
        0.7 * ((i.feedbackMean - 1) / 4) + 0.3 * (i.recommendRate ?? 0)
      : null;

  const signals = [completionRate, feedbackScore].filter((v): v is number => v !== null);
  if (signals.length === 0) {
    return { score: round(i.base), observed: null, weight: 0, completionRate, feedbackScore };
  }

  const observed = signals.reduce((a, b) => a + b, 0) / signals.length;
  const evidence = Math.max(i.starters, i.feedbackCount);
  const weight = Math.min(MAX_OBSERVED_WEIGHT, (evidence / FULL_WEIGHT_AT) * MAX_OBSERVED_WEIGHT);
  const score = Math.min(1, Math.max(0, (1 - weight) * i.base + weight * observed));

  return {
    score: round(score),
    observed: round(observed),
    weight: round(weight),
    completionRate: completionRate === null ? null : round(completionRate),
    feedbackScore: feedbackScore === null ? null : round(feedbackScore),
  };
}

/**
 * Recomputes every course that has any evidence, in three grouped queries.
 *
 * Courses nobody at T&C has taken are not touched: their score is the curated
 * one and there is nothing to learn yet. Only scores that actually moved are
 * written, so a nightly run on a quiet day writes almost nothing.
 */
export async function recomputeQualityScores(now = new Date()) {
  // Who counts as having had their chance to finish: everyone who did, everyone
  // who dropped it, and anyone still "in progress" long after starting. Someone
  // who began last week has not failed to complete, and counting them as if
  // they had punished exactly the courses people were most eager to start.
  // Waiting for proof counts as neither — it is not decided yet.
  const staleBefore = new Date(now.getTime() - STALE_AFTER_DAYS * 86400000);
  const [enrolled, done, feedback] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: {
        OR: [
          { status: { in: ["COMPLETED", "DROPPED"] } },
          { status: "IN_PROGRESS", startedAt: { lt: staleBefore } },
          { status: "IN_PROGRESS", startedAt: null, enrolledAt: { lt: staleBefore } },
        ],
      },
      _count: { _all: true },
    }),
    prisma.enrollment.groupBy({ by: ["courseId"], where: { status: "COMPLETED" }, _count: { _all: true } }),
    prisma.courseFeedback.groupBy({
      by: ["courseId"],
      _count: { _all: true },
      _avg: { usefulness: true, relevance: true },
    }),
  ]);
  const recommends = await prisma.courseFeedback.groupBy({
    by: ["courseId"],
    where: { wouldRecommend: true },
    _count: { _all: true },
  });

  const completedBy = new Map(done.map((d) => [d.courseId, d._count._all]));
  const recommendBy = new Map(recommends.map((r) => [r.courseId, r._count._all]));
  const feedbackBy = new Map(feedback.map((f) => [f.courseId, f]));
  const startersBy = new Map(enrolled.map((e) => [e.courseId, e._count._all]));

  const ids = [...new Set([...startersBy.keys(), ...feedbackBy.keys()])];
  if (ids.length === 0) return { considered: 0, updated: 0 };

  const courses = await prisma.course.findMany({
    where: { id: { in: ids } },
    select: { id: true, qualityScore: true, qualityBreakdown: true },
  });

  let updated = 0;
  for (const c of courses) {
    const previous = parseJson<{ base?: number }>(c.qualityBreakdown, {});
    // The base is fixed the first time a course is scored, so repeated nightly
    // runs blend against the same starting point instead of compounding.
    const base = typeof previous.base === "number" ? previous.base : c.qualityScore;
    const f = feedbackBy.get(c.id);
    const feedbackCount = f?._count._all ?? 0;
    const means = [f?._avg.usefulness, f?._avg.relevance].filter((v): v is number => typeof v === "number");

    const inputs: QualityInputs = {
      base,
      starters: startersBy.get(c.id) ?? 0,
      completed: completedBy.get(c.id) ?? 0,
      feedbackCount,
      feedbackMean: means.length ? means.reduce((a, b) => a + b, 0) / means.length : null,
      recommendRate: feedbackCount ? (recommendBy.get(c.id) ?? 0) / feedbackCount : null,
    };
    const result = computeQuality(inputs);
    if (Math.abs(result.score - c.qualityScore) < 0.005 && typeof previous.base === "number") continue;

    await prisma.course.update({
      where: { id: c.id },
      data: {
        qualityScore: result.score,
        qualityBreakdown: JSON.stringify({ ...inputs, ...result, computedAt: now.toISOString() }),
      },
    });
    updated++;
  }
  return { considered: courses.length, updated };
}
