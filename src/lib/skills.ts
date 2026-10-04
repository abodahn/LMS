import { prisma } from "./db";

/**
 * Skill gaps, and the development plan that closes them.
 *
 * The gap is arithmetic — required level minus held level — and deliberately
 * stays that way. A manager is going to act on this in a performance
 * conversation, so every number on the screen has to be one they can check
 * themselves and defend to the person sitting opposite them. Nothing here is
 * weighted, scored or smoothed.
 *
 * What the system does decide is *ordering*: which gap to work on first, and
 * which course to point at. Both rules are stated below and both are visible in
 * the result, for the same reason the recommendation engine explains itself.
 */

/** The proficiency scale, shared by requirements and ratings alike. */
export const SKILL_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export const MAX_LEVEL = 5;

/** Where a rating came from. An observed rating outranks a claimed one. */
export const SKILL_SOURCES = ["SELF", "MANAGER", "ASSESSMENT", "COURSE"] as const;
export type SkillSource = (typeof SKILL_SOURCES)[number];

export const GOAL_STATUSES = ["PROPOSED", "APPROVED", "DONE", "DROPPED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export type SkillGap = {
  skillId: string;
  key: string;
  name: string;
  nameAr: string | null;
  nameTr: string | null;
  category: string;
  description: string | null;
  required: number;
  held: number;
  gap: number;
  isCritical: boolean;
  /** Null when nobody has ever rated this skill, which is not the same as zero. */
  source: SkillSource | null;
  ratedAt: Date | null;
  ratedBy: string | null;
};

/**
 * Critical first, then by how far behind, then by name.
 *
 * The last term is not cosmetic: without it two gaps of equal size swap places
 * between loads, and a list that reorders itself while somebody is working down
 * it is a list they will stop trusting.
 */
export const bySeverity = (a: SkillGap, b: SkillGap) =>
  Number(b.isCritical) - Number(a.isCritical) || b.gap - a.gap || a.name.localeCompare(b.name);

/**
 * Which gaps make it onto a plan: every critical one, and the three largest of
 * the rest. A plan with fifteen lines on it is a plan nobody starts, and the
 * critical ones are not negotiable — they are the ones stopping the job being
 * done rather than being done better.
 */
export function shortlistGaps(gaps: SkillGap[]): SkillGap[] {
  const sorted = [...gaps].sort(bySeverity);
  return [...sorted.filter((g) => g.isCritical), ...sorted.filter((g) => !g.isCritical).slice(0, 3)];
}

/**
 * Best course for a gap: one that actually reaches the level wanted, then the
 * shortest, then free before paid.
 *
 * Shortest rather than most thorough, because a gap is closed by the cheapest
 * thing that closes it. Free before paid at equal length, because a paid course
 * needs a budget approval and a development plan should not quietly depend on
 * one being granted.
 */
export function rankCourses<
  T extends { targetLevel: number; estimatedHours: number; isFree: boolean; language?: string },
>(courses: T[], toLevel: number, locale?: string): T[] {
  return [...courses].sort(
    (a, b) =>
      Number(b.targetLevel >= toLevel) - Number(a.targetLevel >= toLevel) ||
      (locale ? Number(b.language === locale) - Number(a.language === locale) : 0) ||
      a.estimatedHours - b.estimatedHours ||
      Number(b.isFree) - Number(a.isFree),
  );
}

/**
 * The catalogue carries the same Microsoft module once per language, which is
 * right for browsing and wrong for a suggestion: three lines that are one
 * course read as three options and are none. Near-identical titles collapse to
 * the first, which ranking has already made the best one.
 */
export function dedupeByTitle<T extends { title: string }>(courses: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const c of courses) {
    // Compared on letters and digits only: the same title differs between
    // locales by punctuation and casing more often than by words.
    const fingerprint = c.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    out.push(c);
  }
  return out;
}

export type SkillProfile = {
  jobTitle: string | null;
  gaps: SkillGap[];
  /** Requirements already met, kept so a profile shows strengths and not only debts. */
  met: SkillGap[];
  criticalGaps: number;
  /** Requirements met, as a share of all requirements. Null when the job has none. */
  readiness: number | null;
  unrated: number;
};

/**
 * Everything a job expects of this employee, against what they hold.
 *
 * A requirement with no rating counts as level 0 — the employee has not been
 * shown to have it — but is reported separately as `unrated`, because "nobody
 * has looked" and "we looked and they cannot" call for different responses.
 */
export async function skillProfile(userId: string): Promise<SkillProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { jobTitleId: true, jobTitle: { select: { name: true } } },
  });

  if (!user?.jobTitleId) {
    return { jobTitle: null, gaps: [], met: [], criticalGaps: 0, readiness: null, unrated: 0 };
  }
  return skillProfileFor(userId, { id: user.jobTitleId, name: user.jobTitle?.name ?? null });
}

/**
 * The same comparison against any job title, not only the one someone holds:
 * what a career page and a succession view both need is "measured against the
 * next role, how far is this person?" — and it has to be the identical
 * arithmetic, or the two screens would disagree about the same person.
 */
export async function skillProfileFor(
  userId: string,
  jobTitle: { id: string; name: string | null },
): Promise<SkillProfile> {
  const [requirements, held] = await Promise.all([
    prisma.jobTitleSkill.findMany({
      where: { jobTitleId: jobTitle.id, skill: { isActive: true } },
      include: { skill: true },
    }),
    prisma.userSkill.findMany({
      where: { userId },
      include: { ratedBy: { select: { fullName: true } } },
    }),
  ]);

  const heldBySkill = new Map(held.map((h) => [h.skillId, h]));

  const rows: SkillGap[] = requirements.map((r) => {
    const mine = heldBySkill.get(r.skillId);
    const level = mine?.level ?? 0;
    return {
      skillId: r.skillId,
      key: r.skill.key,
      name: r.skill.name,
      nameAr: r.skill.nameAr,
      nameTr: r.skill.nameTr,
      category: r.skill.category,
      description: r.skill.description,
      required: r.requiredLevel,
      held: level,
      gap: Math.max(0, r.requiredLevel - level),
      isCritical: r.isCritical,
      source: (mine?.source as SkillSource) ?? null,
      ratedAt: mine?.ratedAt ?? null,
      ratedBy: mine?.ratedBy?.fullName ?? null,
    };
  });

  const gaps = rows.filter((r) => r.gap > 0).sort(bySeverity);
  const met = rows.filter((r) => r.gap === 0).sort((a, b) => a.name.localeCompare(b.name));

  return {
    jobTitle: jobTitle.name,
    gaps,
    met,
    criticalGaps: gaps.filter((g) => g.isCritical).length,
    readiness: rows.length ? met.length / rows.length : null,
    unrated: rows.filter((r) => r.source === null).length,
  };
}

export type SuggestedCourse = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  titleTr: string | null;
  estimatedHours: number;
  isFree: boolean;
  language: string;
  targetLevel: number;
};

/**
 * Courses that develop a given skill, best fit first.
 *
 * Ordered by `rankCourses`, and capped at three: a plan line with a menu on it
 * is a decision handed back to the person who wanted to be told what to do.
 */
export async function coursesForSkill(
  skillId: string,
  toLevel: number,
  locale?: string,
): Promise<SuggestedCourse[]> {
  const links = await prisma.courseSkill.findMany({
    where: {
      skillId,
      course: { status: "PUBLISHED", stillAvailable: true },
    },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          titleAr: true,
          titleTr: true,
          estimatedHours: true,
          isFree: true,
          language: true,
        },
      },
    },
  });

  return dedupeByTitle(
    rankCourses(
      links.map((l) => ({ ...l.course, targetLevel: l.targetLevel })),
      toLevel,
      locale,
    ),
  ).slice(0, 3);
}

/**
 * Turns the gaps into proposed plan items.
 *
 * Proposed, never approved: this is a suggestion to a manager, and an
 * individual development plan that appeared by itself and committed someone to
 * a date is not a plan anyone owns. Existing goals are left exactly as they
 * are — a manager's edit is not something a rerun may overwrite.
 *
 * What lands on the plan is decided by `shortlistGaps`.
 */
export async function proposeDevelopmentPlan(userId: string, createdById: string | null) {
  const { gaps } = await skillProfile(userId);
  if (gaps.length === 0) return { created: 0 };

  const shortlist = shortlistGaps(gaps);

  // Open goals are the manager's and are never touched. A goal that was closed
  // or dropped is history, and a gap that has opened again since deserves a
  // fresh proposal — one row per person and skill means reopening that row.
  const goals = await prisma.developmentGoal.findMany({ where: { userId }, select: { skillId: true, status: true } });
  const open = new Set(goals.filter((g) => g.status === "PROPOSED" || g.status === "APPROVED").map((g) => g.skillId));

  let created = 0;
  for (const gap of shortlist) {
    if (open.has(gap.skillId)) continue;
    const fresh = {
      fromLevel: gap.held,
      targetLevel: gap.required,
      status: "PROPOSED",
      targetDate: null,
      note: null,
      createdById,
      approvedById: null,
      approvedAt: null,
      completedAt: null,
    };
    await prisma.developmentGoal.upsert({
      where: { userId_skillId: { userId, skillId: gap.skillId } },
      update: fresh,
      create: { userId, skillId: gap.skillId, ...fresh },
    });
    created++;
  }
  return { created };
}

/**
 * Records a skill rating.
 *
 * A self-rating never overwrites one a manager or an assessment set: someone
 * marking themselves proficient must not erase the observation that said
 * otherwise. Every other combination is last-writer-wins, which is what a
 * re-rating is for.
 */
export async function rateSkill(input: {
  userId: string;
  skillId: string;
  level: number;
  source: SkillSource;
  ratedById: string | null;
  note?: string | null;
}) {
  const level = Math.max(0, Math.min(MAX_LEVEL, Math.round(input.level)));
  const current = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: input.userId, skillId: input.skillId } },
  });

  if (current && input.source === "SELF" && current.source !== "SELF") {
    return { updated: false, reason: "observed-rating-kept" as const };
  }

  const data = {
    level,
    source: input.source,
    note: input.note ?? null,
    ratedById: input.ratedById,
    ratedAt: new Date(),
  };

  await prisma.userSkill.upsert({
    where: { userId_skillId: { userId: input.userId, skillId: input.skillId } },
    update: data,
    create: { userId: input.userId, skillId: input.skillId, ...data },
  });

  // A goal whose target has been reached closes itself. Left open, a plan fills
  // up with things already done and stops meaning anything.
  //
  // Only on observed evidence. A goal is something a manager agreed; letting
  // the employee close it by claiming the level would hand them a switch over
  // their manager's commitment, and the closed goal would drop out of every
  // view the manager could have reopened it from.
  const goal = await prisma.developmentGoal.findUnique({
    where: { userId_skillId: { userId: input.userId, skillId: input.skillId } },
  });
  if (
    goal &&
    input.source !== "SELF" &&
    (goal.status === "PROPOSED" || goal.status === "APPROVED") &&
    level >= goal.targetLevel
  ) {
    await prisma.developmentGoal.update({
      where: { id: goal.id },
      data: { status: "DONE", completedAt: new Date() },
    });
  }

  return { updated: true, level };
}
