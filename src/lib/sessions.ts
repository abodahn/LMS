import { prisma } from "./db";
import { courseCompleted } from "./webhooks";
import { issueCourseCertificate } from "./certificates";
import { awardBadges } from "./badges";
import { notify } from "./notifications";
import { recalcEnrollmentProgress } from "./learner";
import { canComplete } from "./completion-rule";
import { creditHours } from "./session-hours";

export { creditHours };

/**
 * Instructor-led training.
 *
 * A garment factory does most of its real training standing on the floor, and
 * none of that was representable here: the platform could only record things a
 * learner clicks through on their own. A session is a room, a date and a
 * register — and the register is the part that matters, because attendance is
 * what turns a morning in a training room into hours on somebody's record.
 *
 * Capacity is enforced at the point of registration rather than by a periodic
 * tidy-up, and the queue is ordered so that promoting from it is unambiguous.
 */

export const SESSION_MODES = ["IN_PERSON", "ONLINE", "HYBRID"] as const;
export const SESSION_STATUSES = ["SCHEDULED", "CANCELLED", "COMPLETED"] as const;
export const REGISTRATION_STATUSES = [
  "REGISTERED",
  "WAITLISTED",
  "CANCELLED",
  "ATTENDED",
  "ABSENT",
] as const;

export type RegisterOutcome =
  | { ok: true; status: "REGISTERED" | "WAITLISTED"; waitlistOrder: number | null }
  | { ok: false; reason: "FULL" | "CANCELLED" | "PAST" | "CLASH"; clashTitle?: string };

/** Seats that count against capacity. A cancelled or absent seat does not hold one. */
const HOLDS_SEAT = ["REGISTERED", "ATTENDED"];

export async function seatsTaken(sessionId: string): Promise<number> {
  return prisma.sessionRegistration.count({
    where: { sessionId, status: { in: HOLDS_SEAT } },
  });
}

/**
 * Two sessions clash when their times overlap at all.
 *
 * Checked because the cost of finding out on the day is a person standing in
 * the wrong room, and a double booking is invisible until then.
 */
export async function findClash(userId: string, startsAt: Date, endsAt: Date, exceptSessionId?: string) {
  return prisma.sessionRegistration.findFirst({
    where: {
      userId,
      status: { in: ["REGISTERED", "WAITLISTED"] },
      session: {
        status: "SCHEDULED",
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
        // Overlap, rather than containment: starts before the other ends and
        // ends after the other starts.
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    },
    include: { session: { select: { title: true, startsAt: true } } },
  });
}

export async function registerForSession(sessionId: string, userId: string): Promise<RegisterOutcome> {
  const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!session) return { ok: false, reason: "CANCELLED" };
  if (session.status !== "SCHEDULED") return { ok: false, reason: "CANCELLED" };
  if (session.startsAt.getTime() < Date.now()) return { ok: false, reason: "PAST" };

  const clash = await findClash(userId, session.startsAt, session.endsAt, sessionId);
  if (clash) return { ok: false, reason: "CLASH", clashTitle: clash.session.title };

  const existing = await prisma.sessionRegistration.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (existing && existing.status !== "CANCELLED") {
    return {
      ok: true,
      status: existing.status === "WAITLISTED" ? "WAITLISTED" : "REGISTERED",
      waitlistOrder: existing.waitlistOrder,
    };
  }

  const taken = await seatsTaken(sessionId);
  const full = taken >= session.capacity;

  if (full && !session.waitlistEnabled) return { ok: false, reason: "FULL" };

  let waitlistOrder: number | null = null;
  if (full) {
    const last = await prisma.sessionRegistration.findFirst({
      where: { sessionId, status: "WAITLISTED" },
      orderBy: { waitlistOrder: "desc" },
      select: { waitlistOrder: true },
    });
    waitlistOrder = (last?.waitlistOrder ?? 0) + 1;
  }

  const status = full ? "WAITLISTED" : "REGISTERED";
  const data = { status, waitlistOrder, registeredAt: new Date(), attendanceAt: null, attendanceById: null };

  if (existing) {
    await prisma.sessionRegistration.update({ where: { id: existing.id }, data });
  } else {
    await prisma.sessionRegistration.create({ data: { sessionId, userId, ...data } });
  }

  return { ok: true, status, waitlistOrder };
}

/**
 * Gives up a seat and moves the queue along.
 *
 * Promotion happens here rather than on a timer so the person who takes the
 * seat learns about it while it is still useful to them.
 */
export async function cancelRegistration(sessionId: string, userId: string): Promise<{ promotedUserId?: string }> {
  const registration = await prisma.sessionRegistration.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (!registration || registration.status === "CANCELLED") return {};

  const heldSeat = HOLDS_SEAT.includes(registration.status);
  await prisma.sessionRegistration.update({
    where: { id: registration.id },
    data: { status: "CANCELLED", waitlistOrder: null },
  });

  if (!heldSeat) return {};

  const next = await prisma.sessionRegistration.findFirst({
    where: { sessionId, status: "WAITLISTED" },
    orderBy: { waitlistOrder: "asc" },
    include: { session: { select: { title: true, startsAt: true } } },
  });
  if (!next) return {};

  await prisma.sessionRegistration.update({
    where: { id: next.id },
    data: { status: "REGISTERED", waitlistOrder: null },
  });

  await notify(next.userId, {
    category: "LEARNING",
    title: `A seat opened: ${next.session.title}`,
    body: "You were on the waiting list and now have a place. The session details are in your sessions list.",
    link: "/sessions",
  });

  return { promotedUserId: next.userId };
}

export type AttendanceMark = { userId: string; attended: boolean };

/**
 * Records who turned up, and credits the learning.
 *
 * Attendance is the only evidence an in-person session produces, so it is what
 * completes the enrolment: if the session delivers a course, everyone marked
 * present has that course completed for them — unless a supervisor must still
 * sign the practical off, or the course has online lessons of its own to do.
 * Nobody is enrolled behind their back — a seat in the session is the consent.
 */
export async function markAttendance(sessionId: string, marks: AttendanceMark[], markedById: string) {
  const session = await prisma.trainingSession.findUniqueOrThrow({ where: { id: sessionId } });
  const now = new Date();
  let completed = 0;
  const course = session.courseId
    ? await prisma.course.findUnique({
        where: { id: session.courseId },
        select: { requiresSignOff: true, modules: { select: { lessons: { where: { isRequired: true }, select: { id: true } } } } },
      })
    : null;
  // A course with required online lessons is still completed by those lessons;
  // attendance completes only an in-person course, which has none to tick off.
  const inPerson = !!course && course.modules.every((m) => m.lessons.length === 0);

  for (const mark of marks) {
    await prisma.sessionRegistration.updateMany({
      where: { sessionId, userId: mark.userId },
      data: {
        status: mark.attended ? "ATTENDED" : "ABSENT",
        attendanceAt: now,
        attendanceById: markedById,
      },
    });

    if (!mark.attended || !session.courseId || !course) continue;

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: mark.userId, courseId: session.courseId } },
      update: {},
      // Dated with the attendance, so it counts as this enrolment's evidence.
      create: { userId: mark.userId, courseId: session.courseId, source: "ASSIGNED", enrolledAt: now },
    });

    // Completion is set directly (recalc leaves a lesson-less course alone),
    // but a practical that must be watched waits at 100% for the sign-off.
    const open = inPerson && enrollment.status !== "COMPLETED";
    const finishes =
      open &&
      canComplete({
        requiresSignOff: course.requiresSignOff,
        progressPercent: 100,
        hasSignOff: (await prisma.practicalSignOff.count({ where: { enrollmentId: enrollment.id } })) > 0,
      }).ok;
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        ...(open && { progressPercent: 100, startedAt: enrollment.startedAt ?? now }),
        ...(open && !finishes && enrollment.status === "NOT_STARTED" && { status: "IN_PROGRESS" }),
        ...(finishes && { status: "COMPLETED", completedAt: now }),
        lastAccessedAt: now,
        timeSpentMinutes: enrollment.timeSpentMinutes + Math.round(creditHours(session) * 60),
      },
    });
    await recalcEnrollmentProgress(enrollment.id);
    if (finishes) {
      await courseCompleted(enrollment.id);
      // Attendance completes the course like any other route, so it earns the
      // same certificate and badges.
      await issueCourseCertificate(mark.userId, enrollment.id);
      await awardBadges(mark.userId);
    }
    completed++;

    await notify(mark.userId, {
      category: "LEARNING",
      title: `Attendance recorded: ${session.title}`,
      body: "Your attendance has been recorded and the hours added to your learning record.",
      link: "/sessions",
    });
  }

  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: { status: session.startsAt.getTime() < Date.now() ? "COMPLETED" : session.status },
  });

  return { marked: marks.length, completed };
}

/** Tells everyone holding a seat that a session is off. */
export async function cancelSession(sessionId: string, reason: string) {
  const session = await prisma.trainingSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { registrations: { where: { status: { in: ["REGISTERED", "WAITLISTED"] } } } },
  });

  await prisma.trainingSession.update({ where: { id: sessionId }, data: { status: "CANCELLED" } });

  for (const registration of session.registrations) {
    await notify(registration.userId, {
      category: "LEARNING",
      title: `Cancelled: ${session.title}`,
      body: reason || "This session has been cancelled. You do not need to attend.",
      link: "/sessions",
    });
  }

  return { notified: session.registrations.length };
}
