import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { todayKey } from "./utils";

/**
 * Points, levels and challenges — recognition on top of the badges already
 * there, and like them they never feed recommendations, skill levels or
 * certification.
 *
 * Points are derived from the records the platform already keeps rather than
 * kept in a ledger of their own, so they can never drift from what someone
 * actually did and a rule change re-scores everyone consistently. Each thing
 * counts once: a lesson by its completion record, an assessment by the first
 * time it was passed — retaking or re-ticking earns nothing.
 *
 * Standings are per department, never per person: the brief asks for no
 * individual leaderboards. Three rules keep anyone's own figures out of reach:
 *  - a department under MIN_GROUP people is not ranked;
 *  - the collective total is the sum of the ranked departments only, so it
 *    cannot be subtracted down to the unranked ones;
 *  - who counts for which department is frozen when the challenge starts, so
 *    a leaver or a transfer does not move a total by exactly their figure.
 */

export const POINTS = { lesson: 2, course: 20, assessment: 15, badge: 10, activeDay: 1 } as const;

/** Points needed to reach each level; level 1 is everyone. */
export const LEVELS = [0, 50, 150, 300, 600, 1000] as const;

/** Below this, a department's total says too much about each person in it. */
export const MIN_GROUP = 3;

export const METRICS = ["POINTS", "COURSES", "LESSONS", "MINUTES", "ACTIVE_DAYS"] as const;
export type Metric = (typeof METRICS)[number];

export type Tally = {
  lessons: number;
  courses: number;
  assessments: number;
  badges: number;
  activeDays: number;
  minutes: number;
};

const EMPTY: Tally = { lessons: 0, courses: 0, assessments: 0, badges: 0, activeDays: 0, minutes: 0 };

export function pointsOf(t: Tally): number {
  return (
    t.lessons * POINTS.lesson +
    t.courses * POINTS.course +
    t.assessments * POINTS.assessment +
    t.badges * POINTS.badge +
    t.activeDays * POINTS.activeDay
  );
}

export function metricOf(t: Tally, metric: Metric): number {
  switch (metric) {
    case "POINTS":
      return pointsOf(t);
    case "COURSES":
      return t.courses;
    case "LESSONS":
      return t.lessons;
    case "MINUTES":
      return t.minutes;
    case "ACTIVE_DAYS":
      return t.activeDays;
  }
}

export function levelFor(points: number) {
  const i = LEVELS.filter((t) => points >= t).length - 1;
  const next = LEVELS[i + 1] ?? null;
  return {
    level: i + 1,
    floor: LEVELS[i],
    next,
    /** 0–1 through the current level; 1 at the top level. */
    progress: next === null ? 1 : (points - LEVELS[i]) / (next - LEVELS[i]),
  };
}

export type Standing = { departmentId: string; members: number; total: number; perPerson: number };

/**
 * Departments ranked by the average per member, so a department of 200 does
 * not beat one of 20 by headcount alone. Departments under MIN_GROUP members
 * are left out rather than ranked.
 */
export function standings(members: { userId: string; departmentId: string }[], values: Map<string, number>): Standing[] {
  const by = new Map<string, { members: number; total: number }>();
  for (const m of members) {
    const d = by.get(m.departmentId) ?? { members: 0, total: 0 };
    d.members++;
    d.total += values.get(m.userId) ?? 0;
    by.set(m.departmentId, d);
  }
  return [...by.entries()]
    .filter(([, d]) => d.members >= MIN_GROUP)
    .map(([departmentId, d]) => ({ departmentId, ...d, perPerson: d.total / d.members }))
    .sort((a, b) => b.perPerson - a.perPerson || b.total - a.total || a.departmentId.localeCompare(b.departmentId));
}

/**
 * What a challenge may publish. Company: the ranked departments and the sum of
 * those alone. Department: its total, if it is big enough to hide its members.
 */
export function summarise(
  entrants: { userId: string; departmentId: string }[],
  values: Map<string, number>,
  isDepartmentChallenge: boolean,
) {
  if (isDepartmentChallenge) {
    const total = entrants.reduce((s, e) => s + (values.get(e.userId) ?? 0), 0);
    return { standings: [] as Standing[], total: entrants.length >= MIN_GROUP ? total : null };
  }
  const ranked = standings(entrants, values);
  return { standings: ranked, total: ranked.length ? ranked.reduce((s, r) => s + r.total, 0) : null };
}

export type Window = { from: Date; to: Date };

/**
 * What each person matching `who` did, all time or within a window. `who`
 * travels into each query as a relation filter, never as a list of ids, so the
 * size of the company is not bounded by SQLite's 999 bound parameters.
 */
export async function tallies(window: Window | null, who: Prisma.UserWhereInput): Promise<Map<string, Tally>> {
  const at = window ? { gte: window.from, lte: window.to } : undefined;
  const days = window ? { gte: todayKey(window.from), lte: todayKey(window.to) } : undefined;

  const [activity, courses, passes, badges, lessons] = await Promise.all([
    prisma.learningActivity.groupBy({
      by: ["userId"],
      where: { user: who, ...(days ? { day: days } : {}) },
      _sum: { minutes: true },
      _count: { _all: true },
    }),
    prisma.enrollment.groupBy({
      by: ["userId"],
      where: { user: who, status: "COMPLETED", ...(at ? { completedAt: at } : {}) },
      _count: { _all: true },
    }),
    // One row per person and assessment, dated by the first pass.
    prisma.assessmentAttempt.groupBy({
      by: ["userId", "definitionId"],
      where: { user: who, status: "GRADED", passed: true },
      _min: { submittedAt: true },
    }),
    prisma.userBadge.groupBy({
      by: ["userId"],
      where: { user: who, ...(at ? { earnedAt: at } : {}) },
      _count: { _all: true },
    }),
    // ponytail: one small row per completed lesson in scope; a raw GROUP BY
    // if a company-wide window ever grows past a few hundred thousand.
    prisma.lessonProgress.findMany({
      where: { status: "COMPLETED", enrollment: { user: who }, ...(at ? { completedAt: at } : {}) },
      select: { enrollment: { select: { userId: true } } },
    }),
  ]);

  const out = new Map<string, Tally>();
  const get = (id: string) => {
    let t = out.get(id);
    if (!t) out.set(id, (t = { ...EMPTY }));
    return t;
  };
  for (const a of activity) {
    const t = get(a.userId);
    t.minutes = a._sum.minutes ?? 0;
    t.activeDays = a._count._all;
  }
  for (const c of courses) get(c.userId).courses = c._count._all;
  for (const p of passes) {
    const first = p._min.submittedAt;
    if (!window || (first && first >= window.from && first <= window.to)) get(p.userId).assessments++;
  }
  for (const b of badges) get(b.userId).badges = b._count._all;
  for (const l of lessons) get(l.enrollment.userId).lessons++;
  return out;
}

export async function myProgress(userId: string) {
  const t = (await tallies(null, { id: userId })).get(userId) ?? EMPTY;
  const points = pointsOf(t);
  return { points, ...levelFor(points) };
}

/** Challenges running now that this person takes part in. */
export async function liveChallenges(departmentId: string | null, now = new Date()) {
  return prisma.challenge.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [{ departmentId: null }, ...(departmentId ? [{ departmentId }] : [])],
    },
    include: { department: { select: { name: true, nameAr: true, nameTr: true } } },
    orderBy: { endsAt: "asc" },
  });
}

type ChallengeShape = { id: string; metric: string; startsAt: Date; endsAt: Date; departmentId: string | null };

/**
 * Who counts, and for which department, frozen at the first look after the
 * challenge starts. Later joiners are not added and leavers are not removed.
 */
async function entrants(c: ChallengeShape) {
  const select = { userId: true, departmentId: true } as const;
  const existing = await prisma.challengeEntrant.findMany({ where: { challengeId: c.id }, select });
  if (existing.length || c.startsAt > new Date()) return existing;

  const people = await prisma.user.findMany({
    where: { status: "ACTIVE", deletedAt: null, departmentId: c.departmentId ?? { not: null } },
    select: { id: true, departmentId: true },
  });
  try {
    await prisma.challengeEntrant.createMany({
      data: people.map((p) => ({ challengeId: c.id, userId: p.id, departmentId: p.departmentId! })),
    });
  } catch {
    // A concurrent first look wrote the snapshot; read theirs.
  }
  return prisma.challengeEntrant.findMany({ where: { challengeId: c.id }, select });
}

export type ChallengeResult = {
  mine: number;
  /** Company challenges: departments ranked. Department challenges: empty. */
  standings: (Standing & { name: string; nameAr: string | null; nameTr: string | null })[];
  /** The total counted towards the target, or null when it would expose individuals. */
  total: number | null;
};

export async function challengeResult(c: ChallengeShape, userId: string): Promise<ChallengeResult> {
  const metric = (METRICS as readonly string[]).includes(c.metric) ? (c.metric as Metric) : "POINTS";
  const window = { from: c.startsAt, to: c.endsAt };
  const people = await entrants(c);

  const [counted, own] = await Promise.all([
    tallies(window, { challengeEntries: { some: { challengeId: c.id } } }),
    // The viewer's own figure, whether or not they count for a department.
    tallies(window, { id: userId }),
  ]);
  const values = new Map([...counted].map(([id, t]) => [id, metricOf(t, metric)]));
  const { standings: ranked, total } = summarise(people, values, c.departmentId !== null);

  const names = await prisma.department.findMany({
    where: { id: { in: ranked.map((r) => r.departmentId) } },
    select: { id: true, name: true, nameAr: true, nameTr: true },
  });
  return {
    mine: metricOf(own.get(userId) ?? EMPTY, metric),
    standings: ranked.map((r) => {
      const d = names.find((n) => n.id === r.departmentId);
      return { ...r, name: d?.name ?? "", nameAr: d?.nameAr ?? null, nameTr: d?.nameTr ?? null };
    }),
    total,
  };
}
