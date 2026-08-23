import "server-only";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { READINESS_DEFAULT_WEIGHTS, SETTING_KEYS, LEVEL_CODES, type LevelCode, type Locale } from "./constants";
import { localized } from "./i18n";

/** A course is stale once its own review interval has elapsed since the last check. */
export function needsCourseReview(course: { lastVerifiedAt: Date | null; reviewIntervalDays: number }) {
  return (
    !course.lastVerifiedAt ||
    course.lastVerifiedAt.getTime() < Date.now() - course.reviewIntervalDays * 86400000
  );
}


export type LevelDistribution = Record<LevelCode, number>;

const emptyDistribution = (): LevelDistribution => ({ L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 });

/** Latest graded placement/final attempt per user — the basis of every metric. */
async function latestAttempts(userIds?: string[]) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      status: "GRADED",
      definition: { type: { in: ["PLACEMENT", "FINAL"] } },
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    orderBy: { submittedAt: "asc" },
    include: { level: true, scores: { include: { competency: true } }, user: { select: { departmentId: true } } },
  });

  const latest = new Map<string, (typeof attempts)[number]>();
  const baseline = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) {
    if (!baseline.has(a.userId)) baseline.set(a.userId, a);
    if (a.isBaseline) baseline.set(a.userId, a);
    latest.set(a.userId, a);
  }
  return { latest, baseline, all: attempts };
}

export type TeamStats = Awaited<ReturnType<typeof getTeamStats>>;

export async function getTeamStats(managerId: string, locale: Locale = "en") {
  const members = await prisma.user.findMany({
    where: { managerId, deletedAt: null, status: "ACTIVE" },
    include: { department: true, jobTitle: true, profile: true },
    orderBy: { fullName: "asc" },
  });
  const ids = members.map((m) => m.id);

  if (ids.length === 0) {
    return {
      members: [],
      rows: [],
      distribution: emptyDistribution(),
      gaps: [] as { key: string; name: string; average: number }[],
      totals: {
        size: 0,
        assessed: 0,
        participation: 0,
        averageLevel: 0,
        completionRate: 0,
        learningHours: 0,
        overdue: 0,
        pendingReviews: 0,
      },
    };
  }

  const [{ latest }, enrollments, activities, submissions] = await Promise.all([
    latestAttempts(ids),
    prisma.enrollment.findMany({
      where: { userId: { in: ids }, status: { not: "DROPPED" } },
      include: { course: true },
    }),
    prisma.learningActivity.findMany({ where: { userId: { in: ids } } }),
    prisma.assignmentSubmission.findMany({
      where: { userId: { in: ids }, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      include: { assignment: true, user: { select: { fullName: true } } },
    }),
  ]);

  const distribution = emptyDistribution();
  const competencyTotals = new Map<string, { name: string; sum: number; count: number }>();
  let levelSum = 0;

  for (const id of ids) {
    const attempt = latest.get(id);
    if (!attempt?.level) continue;
    const code = attempt.level.code as LevelCode;
    distribution[code]++;
    levelSum += LEVEL_CODES.indexOf(code);
    for (const s of attempt.scores) {
      const entry = competencyTotals.get(s.competency.key) ?? {
        name: localized(s.competency, "name", locale),
        sum: 0,
        count: 0,
      };
      entry.sum += s.percentage;
      entry.count++;
      competencyTotals.set(s.competency.key, entry);
    }
  }

  const assessed = [...latest.keys()].filter((id) => ids.includes(id)).length;
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const now = new Date();

  const rows = members.map((m) => {
    const attempt = latest.get(m.id);
    const mine = enrollments.filter((e) => e.userId === m.id);
    const totalHours = mine.reduce((s, e) => s + e.course.estimatedHours, 0);
    const doneHours = mine.reduce((s, e) => s + (e.course.estimatedHours * e.progressPercent) / 100, 0);
    const lastActive = activities
      .filter((a) => a.userId === m.id)
      .map((a) => a.day)
      .sort()
      .at(-1);
    return {
      id: m.id,
      employeeCode: m.employeeCode,
      fullName: m.fullName,
      jobTitle: m.jobTitle?.name ?? null,
      levelCode: (attempt?.level?.code as LevelCode) ?? null,
      levelName: attempt?.level?.name ?? null,
      percentage: attempt?.percentage ?? null,
      courses: mine.length,
      coursesDone: mine.filter((e) => e.status === "COMPLETED").length,
      progress: totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100),
      learningMinutes: mine.reduce((s, e) => s + e.timeSpentMinutes, 0),
      overdue: mine.filter((e) => e.dueAt && e.dueAt < now && e.status !== "COMPLETED").length,
      lastActive: lastActive ?? null,
      managerGoals: m.profile?.managerGoals ?? null,
    };
  });

  return {
    members,
    rows,
    distribution,
    gaps: [...competencyTotals.entries()]
      .map(([key, v]) => ({ key, name: v.name, average: v.count === 0 ? 0 : Math.round(v.sum / v.count) }))
      .sort((a, b) => a.average - b.average)
      .slice(0, 4),
    totals: {
      size: ids.length,
      assessed,
      participation: Math.round((assessed / ids.length) * 100),
      averageLevel: assessed === 0 ? 0 : Math.round((levelSum / assessed) * 10) / 10,
      completionRate:
        enrollments.length === 0 ? 0 : Math.round((completed.length / enrollments.length) * 100),
      learningHours: Math.round(enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0) / 60),
      overdue: enrollments.filter((e) => e.dueAt && e.dueAt < now && e.status !== "COMPLETED").length,
      pendingReviews: submissions.length,
    },
  };
}

export type ExecutiveStats = Awaited<ReturnType<typeof getExecutiveStats>>;

export async function getExecutiveStats(locale: Locale = "en") {
  const [users, departments, enrollments, certificates, { latest, baseline }, activities, opportunities] =
    await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null, status: "ACTIVE" },
        select: { id: true, departmentId: true, fullName: true, employeeCode: true },
      }),
      prisma.department.findMany({ orderBy: { order: "asc" } }),
      prisma.enrollment.findMany({ where: { status: { not: "DROPPED" } }, include: { course: true } }),
      prisma.certificate.findMany({ where: { status: "VALID" } }),
      latestAttempts(),
      prisma.learningActivity.findMany({ orderBy: { day: "asc" } }),
      prisma.aiOpportunity.findMany(),
    ]);

  const responsiblePassed = await prisma.assessmentAttempt.findMany({
    where: { status: "GRADED", passed: true, definition: { type: "RESPONSIBLE_AI" } },
    select: { userId: true },
  });
  const capstonesApproved = await prisma.assignmentSubmission.findMany({
    where: { status: "APPROVED", assignment: { type: "CAPSTONE" } },
    select: { userId: true },
  });

  const total = users.length;
  const assessed = users.filter((u) => latest.has(u.id)).length;
  const enrolledUsers = new Set(enrollments.map((e) => e.userId)).size;
  const completed = enrollments.filter((e) => e.status === "COMPLETED");

  const distribution = emptyDistribution();
  for (const u of users) {
    const code = latest.get(u.id)?.level?.code as LevelCode | undefined;
    if (code) distribution[code]++;
  }

  // Baseline, current and improvement are all reported over the same cohort —
  // the employees who have re-assessed — so the three numbers agree.
  const reassessed = users.filter((u) => {
    const b = baseline.get(u.id);
    const l = latest.get(u.id);
    return b && l && b.id !== l.id;
  });
  const scores = reassessed.map((u) => latest.get(u.id)!.percentage);
  const baselines = reassessed.map((u) => baseline.get(u.id)!.percentage);
  const improvements = reassessed.map((u) => latest.get(u.id)!.percentage - baseline.get(u.id)!.percentage);
  const allCurrent = users.map((u) => latest.get(u.id)?.percentage).filter((v): v is number => v != null);

  const avg = (xs: number[]) => (xs.length === 0 ? 0 : Math.round(xs.reduce((s, v) => s + v, 0) / xs.length));

  // Department heatmap: average per competency, per department.
  const competencies = await prisma.competency.findMany({ where: { isCore: true }, orderBy: { order: "asc" } });
  const heatmap = departments.map((d) => {
    const deptUsers = users.filter((u) => u.departmentId === d.id);
    const row: Record<string, number | null> = {};
    for (const c of competencies) {
      const values = deptUsers
        .map((u) => latest.get(u.id)?.scores.find((s) => s.competencyId === c.id)?.percentage)
        .filter((v): v is number => v != null);
      row[c.key] = values.length === 0 ? null : avg(values);
    }
    const deptEnrol = enrollments.filter((e) => deptUsers.some((u) => u.id === e.userId));
    return {
      departmentId: d.id,
      name: localized(d, "name", locale),
      code: d.code,
      headcount: deptUsers.length,
      assessed: deptUsers.filter((u) => latest.has(u.id)).length,
      completion:
        deptEnrol.length === 0
          ? 0
          : Math.round((deptEnrol.filter((e) => e.status === "COMPLETED").length / deptEnrol.length) * 100),
      hours: Math.round(deptEnrol.reduce((s, e) => s + e.timeSpentMinutes, 0) / 60),
      scores: row,
      overall: avg(deptUsers.map((u) => latest.get(u.id)?.percentage ?? 0).filter((v) => v > 0)),
    };
  });

  // Company competency averages → strengths and gaps.
  const competencyAverages = competencies.map((c) => {
    const values = users
      .map((u) => latest.get(u.id)?.scores.find((s) => s.competencyId === c.id)?.percentage)
      .filter((v): v is number => v != null);
    return { key: c.key, name: localized(c, "name", locale), average: avg(values) };
  });

  // Completion trend by month, from real activity.
  const trend = new Map<string, number>();
  for (const e of completed) {
    if (!e.completedAt) continue;
    const month = e.completedAt.toISOString().slice(0, 7);
    trend.set(month, (trend.get(month) ?? 0) + 1);
  }

  const activityByWeek = new Map<string, number>();
  for (const a of activities) {
    const week = a.day.slice(0, 7);
    activityByWeek.set(week, (activityByWeek.get(week) ?? 0) + a.minutes);
  }

  const activeDayCutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const activeUserIds = new Set(activities.filter((a) => a.day >= activeDayCutoff).map((a) => a.userId));
  const inactive = users.filter(
    (u) => !activeUserIds.has(u.id) && enrollments.some((e) => e.userId === u.id && e.status !== "COMPLETED"),
  );

  const popular = await prisma.enrollment.groupBy({
    by: ["courseId"],
    _count: { courseId: true },
    orderBy: { _count: { courseId: "desc" } },
    take: 6,
  });
  const popularCourses = await Promise.all(
    popular.map(async (p) => ({
      count: p._count.courseId,
      course: await prisma.course.findUnique({ where: { id: p.courseId }, select: { title: true, code: true } }),
    })),
  );

  const strongest = [...competencyAverages].sort((a, b) => b.average - a.average).slice(0, 2);

  const readiness = await computeReadinessIndex({
    total,
    assessed,
    completionRate: enrollments.length === 0 ? 0 : (completed.length / enrollments.length) * 100,
    averageImprovement: avg(improvements),
    responsibleAiShare: total === 0 ? 0 : (new Set(responsiblePassed.map((r) => r.userId)).size / total) * 100,
    applicationShare: total === 0 ? 0 : (new Set(capstonesApproved.map((c) => c.userId)).size / total) * 100,
  });

  return {
    totals: {
      employees: total,
      assessed,
      participation: total === 0 ? 0 : Math.round((assessed / total) * 100),
      enrolled: enrolledUsers,
      completion: enrollments.length === 0 ? 0 : Math.round((completed.length / enrollments.length) * 100),
      learningHours: Math.round(enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0) / 60),
      coursesCompleted: completed.length,
      certificates: certificates.length,
      averageBaseline: avg(baselines),
      averageCurrent: avg(scores),
      averageImprovement: avg(improvements),
      reassessed: reassessed.length,
      averageScoreAllAssessed: avg(allCurrent),
      opportunities: opportunities.length,
      hoursSavedAnnually: Math.round(opportunities.reduce((s, o) => s + (o.annualHoursSaved ?? 0), 0)),
      inactiveLearners: inactive.length,
    },
    distribution,
    heatmap,
    competencies: competencyAverages,
    strengths: strongest,
    // A competency is never shown as both a strength and a gap.
    gaps: [...competencyAverages]
      .filter((c) => !strongest.some((s) => s.key === c.key))
      .sort((a, b) => a.average - b.average)
      .slice(0, 3),
    trend: [...trend.entries()].sort().map(([month, count]) => ({ month, count })),
    activity: [...activityByWeek.entries()].sort().map(([month, minutes]) => ({ month, hours: Math.round(minutes / 60) })),
    popularCourses,
    inactive: inactive.slice(0, 20),
    readiness,
  };
}

export type ReadinessIndex = {
  score: number;
  components: { key: string; label: string; weight: number; value: number; contribution: number }[];
};

/**
 * A transparent index: every component, its weight and its raw value are shown
 * next to the number, so leadership never sees an unexplained score.
 */
export async function computeReadinessIndex(input: {
  total: number;
  assessed: number;
  completionRate: number;
  averageImprovement: number;
  responsibleAiShare: number;
  applicationShare: number;
}): Promise<ReadinessIndex> {
  const settings = await getSettings();
  const weights = {
    ...READINESS_DEFAULT_WEIGHTS,
    ...((settings[SETTING_KEYS.READINESS_WEIGHTS] as typeof READINESS_DEFAULT_WEIGHTS) ?? {}),
  };

  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const values = {
    assessment: input.total === 0 ? 0 : clamp((input.assessed / input.total) * 100),
    training: clamp(input.completionRate),
    // A 40-point gain is treated as a full score for the improvement component.
    improvement: clamp((input.averageImprovement / 40) * 100),
    responsibleAi: clamp(input.responsibleAiShare),
    application: clamp(input.applicationShare),
  };

  const labels: Record<string, string> = {
    assessment: "Assessment participation",
    training: "Training completion",
    improvement: "Skill improvement",
    responsibleAi: "Responsible AI",
    application: "Practical application",
  };

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0) || 100;
  const components = (Object.keys(values) as (keyof typeof values)[]).map((key) => ({
    key,
    label: labels[key],
    weight: weights[key],
    value: Math.round(values[key]),
    contribution: Math.round(((values[key] * weights[key]) / totalWeight) * 10) / 10,
  }));

  return {
    score: Math.round(components.reduce((s, c) => s + c.contribution, 0)),
    components,
  };
}

export type CourseEffectiveness = Awaited<ReturnType<typeof getCourseEffectiveness>>;

export async function getCourseEffectiveness(locale: Locale = "en") {
  const courses = await prisma.course.findMany({
    include: {
      provider: true,
      enrollments: { include: { user: { select: { departmentId: true } } } },
      feedback: true,
    },
    orderBy: { title: "asc" },
  });

  return courses.map((c) => {
    const total = c.enrollments.length;
    const started = c.enrollments.filter((e) => e.status !== "NOT_STARTED").length;
    const done = c.enrollments.filter((e) => e.status === "COMPLETED").length;
    const dropped = c.enrollments.filter((e) => e.status === "DROPPED").length;
    const minutes = c.enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0);
    const usefulness =
      c.feedback.length === 0 ? null : c.feedback.reduce((s, f) => s + f.usefulness, 0) / c.feedback.length;
    const relevance =
      c.feedback.length === 0 ? null : c.feedback.reduce((s, f) => s + f.relevance, 0) / c.feedback.length;
    const departments = new Set(c.enrollments.map((e) => e.user.departmentId).filter(Boolean)).size;

    return {
      id: c.id,
      code: c.code,
      title: localized(c, "title", locale),
      provider: c.provider.name,
      status: c.status,
      enrolled: total,
      started,
      completed: done,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
      dropoutRate: total === 0 ? 0 : Math.round((dropped / total) * 100),
      averageMinutes: done === 0 ? 0 : Math.round(minutes / done),
      usefulness: usefulness ? Math.round(usefulness * 10) / 10 : null,
      relevance: relevance ? Math.round(relevance * 10) / 10 : null,
      recommendRate:
        c.feedback.length === 0
          ? null
          : Math.round((c.feedback.filter((f) => f.wouldRecommend).length / c.feedback.length) * 100),
      departments,
      lastVerifiedAt: c.lastVerifiedAt,
      reviewIntervalDays: c.reviewIntervalDays,
      needsReview: needsCourseReview(c),
    };
  });
}
