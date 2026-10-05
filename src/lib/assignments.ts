import { prisma } from "./db";
import { notifyTranslated } from "./notifications";

/**
 * Who learning gets assigned to, and learning that comes round again.
 *
 * One routine, used by the admin screen and by the scheduler alike. They were
 * going to need the same three decisions — who is in the audience, who already
 * has it, and when it is due — and two copies of that is two places for
 * "already enrolled" to mean something slightly different.
 */

export const AUDIENCES = ["EVERYONE", "DEPARTMENT", "JOB_FAMILY", "JOB_TITLE", "LOCATION", "SHIFT"] as const;
export type Audience = (typeof AUDIENCES)[number];

/**
 * The filter for an audience.
 *
 * Deactivated and deleted people are excluded here rather than by each caller,
 * because assigning mandatory safety training to a leaver is the kind of thing
 * that only shows up as a compliance report nobody can explain.
 */
export function audienceWhere(audience: Audience, value?: string | null) {
  const base = { deletedAt: null, status: "ACTIVE" };
  switch (audience) {
    case "DEPARTMENT":
      return { ...base, departmentId: value ?? "" };
    case "JOB_FAMILY":
      return { ...base, jobTitle: { jobFamily: value ?? "" } };
    case "JOB_TITLE":
      return { ...base, jobTitleId: value ?? "" };
    case "LOCATION":
      return { ...base, locationId: value ?? "" };
    case "SHIFT":
      return { ...base, shift: value ?? "" };
    case "EVERYONE":
    default:
      return base;
  }
}

export type AssignOutcome = { assigned: number; refreshed: number; skipped: number };

/**
 * The date before which a completion counts as expired.
 *
 * Calendar months, not thirty-day blocks: twelve thirty-day months is 360 days,
 * so "annual" training would fall due five days early every year and drift a
 * month every six. Where the day does not exist in the target month (31 March
 * minus one month), it clamps to the month's last day rather than rolling
 * forward into the next.
 */
export function refreshCutoff(now: Date, months: number): Date {
  const d = new Date(now.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/**
 * Assigns a course to an audience.
 *
 * `refreshAfterMonths` is what makes this usable for recurring training: with
 * it, somebody who finished the course longer ago than that is enrolled again
 * rather than skipped. Without it, anyone already enrolled is left alone, which
 * is what a one-off assignment should do.
 *
 * A refresh resets the enrolment rather than deleting it — the certificate and
 * the activity log keep the previous completion, so the history survives while
 * the obligation is genuinely new.
 */
export async function assignCourse(input: {
  courseId: string;
  audience: Audience;
  audienceValue?: string | null;
  dueDays: number;
  source: "ASSIGNED" | "MANDATORY";
  assignedById: string | null;
  refreshAfterMonths?: number;
  notifyLearner?: boolean;
  now?: Date;
}): Promise<AssignOutcome> {
  const now = input.now ?? new Date();
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: input.courseId },
    select: { id: true, title: true, titleAr: true, titleTr: true },
  });

  const users = await prisma.user.findMany({
    where: audienceWhere(input.audience, input.audienceValue),
    select: { id: true },
  });

  const dueAt = new Date(now.getTime() + input.dueDays * 86400000);
  const staleBefore = input.refreshAfterMonths ? refreshCutoff(now, input.refreshAfterMonths) : null;

  const out: AssignOutcome = { assigned: 0, refreshed: 0, skipped: 0 };

  for (const u of users) {
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: u.id, courseId: course.id } },
    });

    if (!existing) {
      await prisma.enrollment.create({
        data: {
          userId: u.id,
          courseId: course.id,
          source: input.source,
          assignedById: input.assignedById,
          dueAt,
        },
      });
      out.assigned++;
    } else if (
      staleBefore &&
      existing.status === "COMPLETED" &&
      existing.completedAt &&
      existing.completedAt < staleBefore
    ) {
      // Last cycle's evidence goes with the reset, in one transaction. Left in
      // place, the completed lesson rows put progress straight back to 100% on
      // the next click, and last year's supervisor sign-off satisfies this
      // year's practical — so the renewal would be recorded as done, and as
      // observed, without anybody doing or watching anything. The certificate
      // and the audit log keep the previous completion. The new enrolment date
      // starts the cycle, so last cycle's proof or attendance earns no new
      // certificate either.
      await prisma.$transaction([
        prisma.lessonProgress.deleteMany({ where: { enrollmentId: existing.id } }),
        prisma.scormState.deleteMany({ where: { enrollmentId: existing.id } }),
        prisma.practicalSignOff.deleteMany({ where: { enrollmentId: existing.id } }),
        prisma.enrollment.update({
          where: { id: existing.id },
          data: {
            status: "NOT_STARTED",
            progressPercent: 0,
            enrolledAt: now,
            startedAt: null,
            completedAt: null,
            selfReportedDone: false,
            source: input.source,
            dueAt,
          },
        }),
      ]);
      out.refreshed++;
    } else {
      out.skipped++;
      continue;
    }

    if (input.notifyLearner !== false) {
      await notifyTranslated(u.id, {
        category: "LEARNING",
        titleKey: "notify.assignedTitle",
        bodyKey: "notify.assignedBody",
        params: { course: { row: course, field: "title" }, date: dueAt.toISOString().slice(0, 10) },
        link: "/learning",
      });
    }
  }

  return out;
}

/**
 * Re-assigns everything whose cycle has come round, for each person.
 *
 * Every active rule is evaluated on every run. The cycle belongs to the person,
 * not the rule: someone who completed eleven months ago is left alone and
 * someone who completed thirteen months ago is refreshed, whatever day the rule
 * was created. An earlier version also gated the whole rule on its own
 * `lastRunAt`, and the two cycles compounded — anyone finishing after a run was
 * always too recent at the next one, so annual training came round every two
 * years, and a new joiner waited up to a year to be assigned it at all.
 *
 * Running daily does not mean notifying daily: `assignCourse` skips anyone
 * already enrolled and not yet due, and notifies only the people it actually
 * assigns or refreshes. `lastRunAt` is kept as "last evaluated", for the admin
 * list.
 */
export async function runRecurringAssignments(now = new Date()) {
  const rules = await prisma.recurringAssignment.findMany({
    where: { isActive: true },
    include: { course: { select: { title: true, status: true } } },
  });

  let assigned = 0;
  let refreshed = 0;
  let fired = 0;

  for (const rule of rules) {
    // A withdrawn course must not be assigned to anyone, however the rule reads.
    if (rule.course.status !== "PUBLISHED") continue;

    const result = await assignCourse({
      courseId: rule.courseId,
      audience: rule.audience as Audience,
      audienceValue: rule.audienceValue,
      dueDays: rule.dueDays,
      source: rule.source === "MANDATORY" ? "MANDATORY" : "ASSIGNED",
      assignedById: rule.createdById,
      refreshAfterMonths: rule.everyMonths,
      now,
    });

    await prisma.recurringAssignment.update({ where: { id: rule.id }, data: { lastRunAt: now } });
    assigned += result.assigned;
    refreshed += result.refreshed;
    if (result.assigned + result.refreshed > 0) fired++;
  }

  return { rules: fired, assigned, refreshed };
}
