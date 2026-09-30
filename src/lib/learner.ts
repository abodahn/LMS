import "server-only";
import { prisma } from "./db";
import { canComplete } from "./completion-rule";
import { getCertificationPolicy } from "./settings";
import { computeStreak, todayKey } from "./utils";

export { computeStreak };
import type { LevelCode } from "./constants";

export type NextAction = {
  key: string;
  href: string;
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
};

/** Structural shape `findNextLesson` needs — keeps it out of the snapshot's own type. */
type LessonWalkable = {
  lessonProgress: { lessonId: string; status: string }[];
  course: {
    modules: {
      id: string;
      title: string;
      lessons: { id: string; moduleId: string; title: string; durationMinutes: number }[];
    }[];
  };
};

export async function getLearnerSnapshot(userId: string) {
  const [profile, latestAttempt, openAttempt, enrollments, plan, certificates, badges, activities, capstone] =
    await Promise.all([
      prisma.employeeProfile.findUnique({ where: { userId } }),
      prisma.assessmentAttempt.findFirst({
        where: { userId, status: "GRADED", definition: { type: { in: ["PLACEMENT", "FINAL"] } } },
        orderBy: { submittedAt: "desc" },
        include: { level: true, scores: { include: { competency: true } }, definition: true },
      }),
      prisma.assessmentAttempt.findFirst({
        where: { userId, status: "IN_PROGRESS" },
        orderBy: { startedAt: "desc" },
        include: { definition: true },
      }),
      prisma.enrollment.findMany({
        where: { userId, status: { not: "DROPPED" } },
        orderBy: [{ order: "asc" }, { enrolledAt: "asc" }],
        include: {
          course: {
            include: {
              provider: true,
              aiLevel: true,
              modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
              assessments: { where: { status: "PUBLISHED" } },
            },
          },
          lessonProgress: true,
          path: true,
          feedback: true,
        },
      }),
      prisma.learningPlan.findUnique({ where: { userId }, include: { path: true } }),
      prisma.certificate.findMany({
        where: { userId, status: "VALID" },
        orderBy: { issuedAt: "desc" },
        include: { course: true, path: true, level: true },
      }),
      prisma.userBadge.findMany({ where: { userId }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
      prisma.learningActivity.findMany({ where: { userId }, orderBy: { day: "desc" }, take: 90 }),
      prisma.assignmentSubmission.findFirst({
        where: { userId, assignment: { type: "CAPSTONE" } },
        include: { assignment: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  const totalHours = enrollments.reduce((s, e) => s + e.course.estimatedHours, 0);
  const completedHours = enrollments
    .filter((e) => e.status === "COMPLETED")
    .reduce((s, e) => s + e.course.estimatedHours, 0);
  const partialHours = enrollments
    .filter((e) => e.status !== "COMPLETED")
    .reduce((s, e) => s + (e.course.estimatedHours * e.progressPercent) / 100, 0);

  const doneHours = Math.min(totalHours, completedHours + partialHours);
  const pathPercent = totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100);

  const active = enrollments.find((e) => e.status === "IN_PROGRESS") ?? enrollments.find((e) => e.status === "NOT_STARTED");

  const nextLesson = active ? findNextLesson(active) : null;

  return {
    profile,
    level: latestAttempt?.level ?? null,
    levelCode: (latestAttempt?.level?.code as LevelCode) ?? null,
    latestAttempt,
    openAttempt,
    competencyScores: (latestAttempt?.scores ?? []).map((s) => ({
      key: s.competency.key,
      name: s.competency.name,
      percentage: s.percentage,
    })),
    enrollments,
    active,
    nextLesson,
    plan,
    certificates,
    badges,
    capstone,
    totals: {
      totalHours,
      doneHours,
      remainingHours: Math.max(0, totalHours - doneHours),
      pathPercent,
      coursesTotal: enrollments.length,
      coursesDone: enrollments.filter((e) => e.status === "COMPLETED").length,
      streak: computeStreak(activities.map((a) => a.day)),
      learningMinutes: enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0),
    },
  };
}

export type LearnerSnapshot = Awaited<ReturnType<typeof getLearnerSnapshot>>;

export type NextLesson = {
  lessonId: string;
  title: string;
  durationMinutes: number;
  moduleTitle: string;
  index: number;
  total: number;
};

/** First required-or-optional lesson the learner has not completed yet. */
export function findNextLesson(enrollment: LessonWalkable): NextLesson | null {
  const done = new Set(
    enrollment.lessonProgress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId),
  );
  const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    if (done.has(lesson.id)) continue;
    return {
      lessonId: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      moduleTitle: enrollment.course.modules.find((m) => m.id === lesson.moduleId)?.title ?? "",
      index: i + 1,
      total: lessons.length,
    };
  }
  return null;
}

/**
 * The single biggest button on the dashboard. Order matters: the earliest
 * unfinished step in the journey always wins so nobody has to work out what
 * comes next.
 */
export async function nextBestAction(snapshot: LearnerSnapshot): Promise<NextAction> {
  const { profile, openAttempt, latestAttempt, enrollments, active, nextLesson, capstone, totals } = snapshot;

  if (!profile || profile.onboardingStep === "PROFILE") {
    return { key: "profile", href: "/onboarding", titleKey: "action.completeProfile", bodyKey: "action.completeProfileBody" };
  }

  if (openAttempt) {
    return {
      key: "resumeAssessment",
      href: `/assessment/${openAttempt.id}`,
      titleKey: "action.takeAssessment",
      bodyKey: "action.takeAssessmentBody",
    };
  }

  if (!latestAttempt) {
    return { key: "assessment", href: "/assessments", titleKey: "action.takeAssessment", bodyKey: "action.takeAssessmentBody" };
  }

  if (profile.onboardingStep === "GOALS") {
    return { key: "goals", href: "/onboarding/goals", titleKey: "action.chooseGoals", bodyKey: "action.chooseGoalsBody" };
  }

  if (enrollments.length === 0) {
    return { key: "path", href: `/assessment/${latestAttempt.id}/result`, titleKey: "action.buildPath", bodyKey: "action.buildPathBody" };
  }

  // An external course the learner said they finished but has not proved yet.
  const awaitingProof = enrollments.find((e) => e.status === "PENDING_VERIFICATION");
  if (awaitingProof) {
    return {
      key: "proof",
      href: `/learning/${awaitingProof.id}`,
      titleKey: "action.uploadCertificate",
      bodyKey: "action.uploadCertificateBody",
      params: { course: awaitingProof.course.title },
    };
  }

  if (active) {
    const percent = Math.round(active.progressPercent);
    if (nextLesson) {
      return {
        key: "continue",
        href: `/learn/${active.id}/${nextLesson.lessonId}`,
        titleKey: percent > 0 ? "action.continueCourse" : "action.startCourse",
        bodyKey: percent > 0 ? "action.continueCourseBody" : "action.startCourseBody",
        params: { course: active.course.title, percent },
      };
    }
    return {
      key: "openCourse",
      href: `/learning/${active.id}`,
      titleKey: percent > 0 ? "action.continueCourse" : "action.startCourse",
      bodyKey: percent > 0 ? "action.continueCourseBody" : "action.startCourseBody",
      params: { course: active.course.title, percent },
    };
  }

  const policy = await getCertificationPolicy();
  const pathComplete = totals.pathPercent >= policy.completionThreshold;

  if (pathComplete && policy.capstoneRequired && (!capstone || capstone.status === "DRAFT")) {
    return { key: "capstone", href: "/capstone", titleKey: "action.startCapstone", bodyKey: "action.startCapstoneBody" };
  }

  if (pathComplete) {
    const final = await prisma.assessmentDefinition.findFirst({ where: { type: "FINAL", status: "PUBLISHED" } });
    const passedFinal = await prisma.assessmentAttempt.findFirst({
      where: { userId: snapshot.profile!.userId, passed: true, definition: { type: "FINAL" } },
    });
    if (final && !passedFinal) {
      return { key: "final", href: "/assessments", titleKey: "action.takeFinal", bodyKey: "action.takeFinalBody" };
    }
  }

  return { key: "done", href: "/use-cases", titleKey: "action.allDone", bodyKey: "action.allDoneBody" };
}

/** Recomputes and stores a course's progress after any lesson change. */
export async function recalcEnrollmentProgress(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: { include: { modules: { include: { lessons: true } } } },
      lessonProgress: true,
      signOff: true,
    },
  });
  if (!enrollment) return null;

  const lessons = enrollment.course.modules.flatMap((m) => m.lessons).filter((l) => l.isRequired);
  const doneIds = new Set(enrollment.lessonProgress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId));
  const percent = lessons.length === 0 ? enrollment.progressPercent : Math.round((lessons.filter((l) => doneIds.has(l.id)).length / lessons.length) * 100);

  // Every completion route arrives here — lessons and SCORM alike — so this is
  // the one place the sign-off rule has to hold. A course that must be
  // demonstrated stays open at 100% until a supervisor has written down what
  // they watched; `signOffPractical` is what closes it.
  const complete =
    lessons.length > 0 &&
    percent >= 100 &&
    canComplete({
      requiresSignOff: enrollment.course.requiresSignOff,
      progressPercent: percent,
      hasSignOff: !!enrollment.signOff,
    }).ok;
  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent: percent,
      status: complete ? "COMPLETED" : percent > 0 ? "IN_PROGRESS" : enrollment.status,
      startedAt: enrollment.startedAt ?? (percent > 0 ? new Date() : null),
      completedAt: complete ? (enrollment.completedAt ?? new Date()) : enrollment.completedAt,
      lastAccessedAt: new Date(),
    },
  });
}

export async function recordActivity(userId: string, minutes: number, lessonsCompleted = 0) {
  const day = todayKey();
  await prisma.learningActivity.upsert({
    where: { userId_day: { userId, day } },
    update: { minutes: { increment: Math.max(0, Math.round(minutes)) }, lessonsCompleted: { increment: lessonsCompleted } },
    create: { userId, day, minutes: Math.max(0, Math.round(minutes)), lessonsCompleted },
  });
}
