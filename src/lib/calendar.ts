import { prisma } from "./db";

/**
 * Everything with a date on it, in one list.
 *
 * The information already existed and was scattered across four screens: a
 * course deadline on My Learning, a classroom session on Sessions, a
 * certificate expiry on Certificates, a development goal on Skills. Nobody
 * checks four screens, which is how a mandatory renewal gets missed by someone
 * who was not avoiding it.
 *
 * Read-only and derived — there is no calendar table, and nothing here is a
 * second copy of a date that can drift from the first.
 */

export const CALENDAR_KINDS = ["DEADLINE", "SESSION", "EXPIRY", "GOAL"] as const;
export type CalendarKind = (typeof CALENDAR_KINDS)[number];

export type CalendarItem = {
  id: string;
  kind: CalendarKind;
  at: Date;
  title: string;
  titleAr: string | null;
  titleTr: string | null;
  /** Whose item it is — only used when a manager is looking at the team. */
  personId: string;
  personName: string;
  href: string;
  /** Past its date and not dealt with. */
  overdue: boolean;
};

/**
 * Items for these people, between now-ish and `days` ahead.
 *
 * A window rather than everything: a list running two years out is a list
 * nobody scrolls. Overdue items are included however old, because those are
 * the ones that matter most and hiding them past a cutoff would be the single
 * worst thing this screen could do.
 */
export async function calendarFor(userIds: string[], days = 90, now = new Date()): Promise<CalendarItem[]> {
  if (userIds.length === 0) return [];
  const until = new Date(now.getTime() + days * 86400000);

  const [enrollments, registrations, certificates, goals] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        userId: { in: userIds },
        dueAt: { not: null, lte: until },
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "PENDING_VERIFICATION"] },
      },
      include: {
        course: { select: { title: true, titleAr: true, titleTr: true } },
        user: { select: { id: true, fullName: true } },
      },
    }),
    prisma.sessionRegistration.findMany({
      where: {
        userId: { in: userIds },
        status: { in: ["REGISTERED", "WAITLISTED"] },
        session: { startsAt: { gte: new Date(now.getTime() - 86400000), lte: until }, status: "SCHEDULED" },
      },
      include: {
        session: { select: { id: true, title: true, titleAr: true, titleTr: true, startsAt: true } },
        user: { select: { id: true, fullName: true } },
      },
    }),
    prisma.certificate.findMany({
      where: { userId: { in: userIds }, status: "VALID", expiresAt: { not: null, lte: until } },
      include: { user: { select: { id: true, fullName: true } } },
    }),
    prisma.developmentGoal.findMany({
      where: {
        userId: { in: userIds },
        status: "APPROVED",
        targetDate: { not: null, lte: until },
      },
      include: {
        skill: { select: { name: true, nameAr: true, nameTr: true } },
        user: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  const items: CalendarItem[] = [
    ...enrollments.map((e) => ({
      id: `deadline-${e.id}`,
      kind: "DEADLINE" as const,
      at: e.dueAt!,
      title: e.course.title,
      titleAr: e.course.titleAr,
      titleTr: e.course.titleTr,
      personId: e.user.id,
      personName: e.user.fullName,
      href: `/learning/${e.id}`,
      overdue: e.dueAt! < now,
    })),
    ...registrations.map((r) => ({
      id: `session-${r.id}`,
      kind: "SESSION" as const,
      at: r.session.startsAt,
      title: r.session.title,
      titleAr: r.session.titleAr,
      titleTr: r.session.titleTr,
      personId: r.user.id,
      personName: r.user.fullName,
      href: `/sessions/${r.session.id}`,
      // A session that has started is not overdue, it has happened.
      overdue: false,
    })),
    ...certificates.map((c) => ({
      id: `expiry-${c.id}`,
      kind: "EXPIRY" as const,
      at: c.expiresAt!,
      title: c.title,
      titleAr: null,
      titleTr: null,
      personId: c.user.id,
      personName: c.user.fullName,
      href: "/certificates",
      overdue: c.expiresAt! < now,
    })),
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      kind: "GOAL" as const,
      at: g.targetDate!,
      title: g.skill.name,
      titleAr: g.skill.nameAr,
      titleTr: g.skill.nameTr,
      personId: g.user.id,
      personName: g.user.fullName,
      href: "/skills",
      overdue: g.targetDate! < now,
    })),
  ];

  return items.sort((a, b) => a.at.getTime() - b.at.getTime() || a.title.localeCompare(b.title));
}

/** Groups by month, keeping the order the sort already established. */
export function groupByMonth(items: CalendarItem[]): { key: string; at: Date; items: CalendarItem[] }[] {
  const groups = new Map<string, { key: string; at: Date; items: CalendarItem[] }>();
  for (const item of items) {
    const key = `${item.at.getFullYear()}-${String(item.at.getMonth() + 1).padStart(2, "0")}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { key, at: new Date(item.at.getFullYear(), item.at.getMonth(), 1), items: [item] });
  }
  return [...groups.values()];
}
