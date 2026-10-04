import { prisma } from "../db";
import { getSettings } from "../settings";
import {
  DEFAULT_RECOMMENDATION_WEIGHTS,
  SETTING_KEYS,
  type CompetencyKey,
  type LevelCode,
  type RecommendationWeightKey,
} from "../constants";
import { parseJson } from "../utils";
import { recommend } from "./engine";
import type { CandidateCourse, EngineOptions, LearnerContext, RecommendationResult } from "./types";

export async function loadWeights(): Promise<Record<RecommendationWeightKey, number>> {
  const rows = await prisma.recommendationWeight.findMany();
  const out = { ...DEFAULT_RECOMMENDATION_WEIGHTS };
  for (const r of rows) {
    if (r.key in out) out[r.key as RecommendationWeightKey] = r.weight;
  }
  return out;
}

export async function loadCatalog(): Promise<CandidateCourse[]> {
  const courses = await prisma.course.findMany({
    include: {
      provider: true,
      aiLevel: true,
      competencies: { include: { competency: true } },
      departments: true,
      jobFamilies: true,
      goals: true,
      languages: true,
      prerequisites: true,
      feedback: { select: { usefulness: true } },
    },
  });

  return courses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    slug: c.slug,
    providerName: c.provider.name,
    providerTrust: c.provider.trustScore,
    platform: c.platform,
    estimatedHours: c.estimatedHours,
    difficulty: c.difficulty,
    language: c.language,
    subtitleLanguages: c.languages.filter((l) => l.isSubtitle).map((l) => l.language),
    levelCode: (c.aiLevel?.code as LevelCode) ?? null,
    status: c.status,
    linkWorking: c.linkWorking,
    stillAvailable: c.stillAvailable,
    isInternal: c.isInternal,
    isTechnical: c.isTechnical,
    isMandatory: c.isMandatory,
    certificateAvailable: c.certificateAvailable,
    qualityScore: c.qualityScore,
    rating: c.rating,
    feedbackScore:
      c.feedback.length > 0
        ? c.feedback.reduce((s, f) => s + f.usefulness, 0) / c.feedback.length
        : null,
    competencies: c.competencies.map((cc) => ({
      key: cc.competency.key as CompetencyKey,
      weight: cc.weight,
    })),
    departmentIds: c.departments.map((d) => d.departmentId),
    jobFamilies: c.jobFamilies.map((j) => ({ jobFamily: j.jobFamily, weight: j.weight })),
    goals: c.goals.map((g) => ({ goalKey: g.goalKey, weight: g.weight })),
    prerequisiteIds: c.prerequisites.map((p) => p.prerequisiteId),
  }));
}

export async function buildLearnerContext(userId: string): Promise<LearnerContext> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      profile: true,
      department: true,
      jobTitle: true,
      goals: true,
      enrollments: true,
    },
  });

  const latest = await prisma.assessmentAttempt.findFirst({
    where: {
      userId,
      status: "GRADED",
      definition: { type: { in: ["PLACEMENT", "FINAL"] } },
    },
    orderBy: { submittedAt: "desc" },
    include: { level: true, scores: { include: { competency: true } } },
  });

  const technical = await prisma.assessmentAttempt.findFirst({
    where: { userId, status: "GRADED", passed: true, definition: { type: "TECHNICAL" } },
    orderBy: { submittedAt: "desc" },
  });

  const competencyScores: Partial<Record<CompetencyKey, number>> = {};
  for (const s of latest?.scores ?? []) {
    competencyScores[s.competency.key as CompetencyKey] = s.percentage;
  }

  const mandatory = await prisma.course.findMany({
    where: { isMandatory: true, status: "PUBLISHED" },
    select: { id: true },
  });

  const nominations = await prisma.enrollment.findMany({
    where: { userId, source: "ASSIGNED", status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
    select: { courseId: true },
  });

  return {
    userId,
    levelCode: (latest?.level?.code as LevelCode) ?? "L0",
    departmentId: user.departmentId,
    departmentName: user.department?.name ?? null,
    jobFamily: user.jobTitle?.jobFamily ?? user.department?.jobFamily ?? "GENERAL",
    jobTitle: user.jobTitle?.name ?? null,
    isTechnical: user.profile?.isTechnical ?? user.jobTitle?.isTechnical ?? false,
    aiExperience: user.profile?.aiExperience ?? "NONE",
    preferredLanguage: user.preferredLanguage,
    weeklyHours: user.profile?.weeklyLearningHours ?? 2,
    goals: user.goals.map((g) => g.goalKey),
    competencyScores,
    completedCourseIds: user.enrollments.filter((e) => e.status === "COMPLETED").map((e) => e.courseId),
    activeCourseIds: user.enrollments
      .filter((e) => e.status !== "COMPLETED" && e.status !== "DROPPED")
      .map((e) => e.courseId),
    managerGoals: user.profile?.managerGoals ?? null,
    mandatoryCourseIds: mandatory.map((m) => m.id),
    nominatedCourseIds: nominations.map((n) => n.courseId),
    hasAssessment: !!latest,
    technicalPassed: !!technical,
  };
}

export async function engineOptions(): Promise<EngineOptions> {
  const [weights, settings, templates] = await Promise.all([
    loadWeights(),
    getSettings(),
    prisma.learningPath.findMany({
      where: { status: "PUBLISHED" },
      include: { targetLevel: true },
    }),
  ]);

  return {
    weights,
    targetHours: Number(settings[SETTING_KEYS.TARGET_LEARNING_HOURS] ?? 35),
    minHours: Number(settings[SETTING_KEYS.MIN_LEARNING_HOURS] ?? 30),
    maxHours: Number(settings[SETTING_KEYS.MAX_LEARNING_HOURS] ?? 40),
    pathTemplates: templates.map((t) => ({
      id: t.id,
      code: t.code,
      title: t.title,
      audienceLevel: t.audienceLevel,
      isTechnical: t.isTechnical,
      jobFamilies: parseJson<string[]>(t.jobFamilies, []),
      targetLevelCode: t.targetLevel?.code ?? null,
    })),
  };
}

/** Pure preview — used by the admin recommendation console. Persists nothing. */
export async function previewRecommendation(userId: string): Promise<{
  result: RecommendationResult;
  learner: LearnerContext;
}> {
  const [learner, catalog, options] = await Promise.all([
    buildLearnerContext(userId),
    loadCatalog(),
    engineOptions(),
  ]);
  return { result: recommend(learner, catalog, options), learner };
}

/** Runs the engine and stores the run, its recommendations and their reasons. */
export async function generateRecommendations(userId: string) {
  const { result, learner } = await previewRecommendation(userId);

  const run = await prisma.recommendationRun.create({
    data: {
      userId,
      engineVersion: result.engineVersion,
      totalHours: result.totalHours,
      targetHours: result.targetHours,
      pathId: result.programPathId,
      inputSnapshot: JSON.stringify({
        levelCode: learner.levelCode,
        jobFamily: learner.jobFamily,
        departmentId: learner.departmentId,
        goals: learner.goals,
        weeklyHours: learner.weeklyHours,
        competencyScores: learner.competencyScores,
        isTechnical: learner.isTechnical,
        preferredLanguage: learner.preferredLanguage,
      }),
      rejected: JSON.stringify(result.rejected.slice(0, 100)),
    },
  });

  // Supersede anything still merely suggested from an earlier run.
  await prisma.recommendation.updateMany({
    where: { userId, status: "SUGGESTED" },
    data: { status: "DISMISSED" },
  });

  for (const item of result.selected) {
    await prisma.recommendation.create({
      data: {
        runId: run.id,
        userId,
        courseId: item.course.id,
        pathId: result.programPathId,
        score: item.score,
        rank: item.order,
        phase: item.phase,
        reasons: {
          create: item.reasons.map((r) => ({
            code: r.code,
            label: r.label,
            contribution: r.contribution,
            detail: r.detail,
          })),
        },
      },
    });
  }

  return { runId: run.id, result };
}

/** Turns the current recommendation into enrolments, preserving phase order. */
export async function enrollFromRecommendations(userId: string, runId?: string) {
  const run = runId
    ? await prisma.recommendationRun.findUniqueOrThrow({ where: { id: runId } })
    : await prisma.recommendationRun.findFirst({ where: { userId }, orderBy: { generatedAt: "desc" } });
  if (!run) return { enrolled: 0 };

  const recs = await prisma.recommendation.findMany({
    // Re-checked at enrolment time: a run is a snapshot, and a course it
    // suggested may have been withdrawn or archived since.
    where: { runId: run.id, status: { not: "DISMISSED" }, course: { status: "PUBLISHED", stillAvailable: true } },
    orderBy: { rank: "asc" },
  });

  let enrolled = 0;
  for (const rec of recs) {
    if (!rec.courseId) continue;
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: rec.courseId } },
    });
    if (existing) continue;
    await prisma.enrollment.create({
      data: {
        userId,
        courseId: rec.courseId,
        pathId: run.pathId,
        source: "RECOMMENDED",
        order: rec.rank,
        phase: rec.phase,
      },
    });
    enrolled++;
  }

  await prisma.recommendation.updateMany({
    where: { runId: run.id, status: "SUGGESTED" },
    data: { status: "ENROLLED" },
  });

  const plan = await prisma.learningPlan.findUnique({ where: { userId } });
  if (!plan) {
    const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
    const hoursPerWeek = profile?.weeklyLearningHours ?? 3;
    await prisma.learningPlan.create({
      data: {
        userId,
        pathId: run.pathId,
        hoursPerWeek,
        targetDate: targetDateFor(run.totalHours, hoursPerWeek),
      },
    });
  }

  return { enrolled };
}

export function targetDateFor(totalHours: number, hoursPerWeek: number, from = new Date()) {
  const weeks = Math.ceil(totalHours / Math.max(0.5, hoursPerWeek));
  const d = new Date(from);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}
