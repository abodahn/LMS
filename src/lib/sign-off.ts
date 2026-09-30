import { prisma } from "./db";
import { notifyTranslated } from "./notifications";
import { onCourseCompleted } from "./completion";
import { rateSkill } from "./skills";

// Re-exported so callers that already reach for sign-off keep one import.
export { canComplete } from "./completion-rule";

/**
 * Supervisor sign-off on learning that has to be demonstrated.
 *
 * For a course flagged `requiresSignOff`, finishing the content is not
 * finishing the course. A video played to the end says nothing about whether
 * somebody can set up a machine, and a system that treats the two as the same
 * thing produces a training record that reads well and means nothing.
 *
 * So progress can reach 100% and the enrolment stays open until a supervisor
 * has written down what they watched.
 */


/**
 * Records that a supervisor watched the work done.
 *
 * The observation is required by the schema and not defaulted here: a sign-off
 * with nothing written under it is a signature, and the whole point of the step
 * is that somebody looked. Where the course maps to a skill, the sign-off also
 * sets that skill's level from an observation — which is the strongest evidence
 * the system can hold, and is exactly what `rateSkill` treats as outranking a
 * self-assessment.
 */
export async function signOffPractical(input: {
  enrollmentId: string;
  signedById: string;
  observation: string;
  skillId?: string | null;
  skillLevel?: number | null;
}) {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: input.enrollmentId },
    include: {
      course: { select: { id: true, title: true, titleAr: true, titleTr: true, requiresSignOff: true } },
      signOff: true,
    },
  });

  if (enrollment.signOff) return { ok: false as const, reason: "already-signed" as const };
  if (!enrollment.course.requiresSignOff) return { ok: false as const, reason: "not-required" as const };

  await prisma.practicalSignOff.create({
    data: {
      enrollmentId: enrollment.id,
      signedById: input.signedById,
      observation: input.observation,
      skillId: input.skillId ?? null,
      skillLevel: input.skillLevel ?? null,
    },
  });

  if (input.skillId && typeof input.skillLevel === "number") {
    await rateSkill({
      userId: enrollment.userId,
      skillId: input.skillId,
      level: input.skillLevel,
      source: "MANAGER",
      ratedById: input.signedById,
      note: input.observation.slice(0, 500),
    });
  }

  await notifyTranslated(enrollment.userId, {
    category: "LEARNING",
    titleKey: "notify.signedOffTitle",
    bodyKey: "notify.signedOffBody",
    params: { course: { row: enrollment.course, field: "title" } },
    link: `/learning/${enrollment.id}`,
  });

  // Completion is the point of the sign-off, so it happens here rather than
  // waiting for the learner to open the course again — through the same hook
  // as every other route, so the certificate is issued too.
  //
  // Not while an uploaded proof is still waiting for an administrator: the
  // sign-off covers the practical, not the external course the proof is for,
  // and completing here would close it without anyone having looked at the
  // proof. `reviewProofAction` completes it once both are in.
  if (
    enrollment.progressPercent >= 100 &&
    enrollment.status !== "COMPLETED" &&
    enrollment.status !== "PENDING_VERIFICATION"
  ) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await onCourseCompleted(enrollment.userId, enrollment.id);
  }

  return { ok: true as const };
}

/** Everything a given supervisor has waiting for them to observe. */
export async function awaitingSignOff(supervisorId: string) {
  return prisma.enrollment.findMany({
    where: {
      course: { requiresSignOff: true },
      progressPercent: { gte: 100 },
      signOff: null,
      // A course already completed is not waiting for anybody. Without this,
      // switching sign-off on for a course would put everyone who finished it
      // last year into the queue, for a practical nobody now needs to watch.
      status: { notIn: ["DROPPED", "COMPLETED"] },
      user: { managerId: supervisorId, deletedAt: null },
    },
    include: {
      course: { select: { id: true, title: true, titleAr: true, titleTr: true, skills: { include: { skill: true } } } },
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { lastAccessedAt: "desc" },
  });
}
