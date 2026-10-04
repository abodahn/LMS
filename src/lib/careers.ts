import { prisma } from "./db";
import { skillProfileFor, type SkillProfile } from "./skills";

/**
 * Where someone can go next, and how far they are from it.
 *
 * Readiness is the skills matrix measured against the next role instead of the
 * current one — the same arithmetic, so the career page and the manager's view
 * of a person can never disagree. Nothing here decides anything about anyone:
 * it shows a person their own route, and shows HR who is developing towards a
 * role that would be hard to fill.
 */

export type LadderStep = { pathId: string; jobTitleId: string; order: number };

/** The titles one rung above this one, across every ladder it is on. */
export function nextStepIds(steps: LadderStep[], jobTitleId: string): string[] {
  const out = new Set<string>();
  for (const here of steps.filter((s) => s.jobTitleId === jobTitleId)) {
    const next = steps.find((s) => s.pathId === here.pathId && s.order === here.order + 1);
    if (next) out.add(next.jobTitleId);
  }
  return [...out];
}

/** The titles one rung below this one: where its successors usually come from. */
export function feederIds(steps: LadderStep[], jobTitleId: string): string[] {
  const out = new Set<string>();
  for (const here of steps.filter((s) => s.jobTitleId === jobTitleId)) {
    const below = steps.find((s) => s.pathId === here.pathId && s.order === here.order - 1);
    if (below) out.add(below.jobTitleId);
  }
  return [...out];
}

export type Candidate = {
  userId: string;
  fullName: string;
  currentTitle: string | null;
  readiness: number | null;
  gaps: number;
  criticalGaps: number;
  unrated: number;
  openGoals: number;
};

/**
 * Most ready first, then fewest critical gaps, then fewest unrated skills.
 *
 * Unrated counts against a candidate only as a tie-breaker: a gap nobody has
 * looked at is not the same as a gap, but someone whose skills have actually
 * been observed is the better-evidenced candidate. Name last, so the order is
 * stable between two loads of the same page.
 */
export function rankCandidates(list: Candidate[]): Candidate[] {
  return [...list].sort(
    (a, b) =>
      (b.readiness ?? -1) - (a.readiness ?? -1) ||
      a.criticalGaps - b.criticalGaps ||
      a.unrated - b.unrated ||
      a.fullName.localeCompare(b.fullName),
  );
}

async function allSteps(): Promise<LadderStep[]> {
  return prisma.careerStep.findMany({ select: { pathId: true, jobTitleId: true, order: true } });
}

export type CareerView = {
  current: { id: string; name: string } | null;
  ladders: {
    id: string;
    name: string;
    nameAr: string | null;
    nameTr: string | null;
    steps: { jobTitleId: string; name: string; order: number; isCurrent: boolean }[];
  }[];
  next: { jobTitle: { id: string; name: string }; profile: SkillProfile }[];
};

/** Someone's ladders and, for each role one rung up, how ready they are. */
export async function careerView(userId: string): Promise<CareerView> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { jobTitle: { select: { id: true, name: true } } },
  });
  if (!user?.jobTitle) return { current: null, ladders: [], next: [] };
  const current = user.jobTitle;

  const paths = await prisma.careerPath.findMany({
    where: { steps: { some: { jobTitleId: current.id } } },
    orderBy: { order: "asc" },
    include: { steps: { orderBy: { order: "asc" }, include: { jobTitle: { select: { id: true, name: true } } } } },
  });

  const ladders = paths.map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    nameTr: p.nameTr,
    steps: p.steps.map((s) => ({
      jobTitleId: s.jobTitleId,
      name: s.jobTitle.name,
      order: s.order,
      isCurrent: s.jobTitleId === current.id,
    })),
  }));

  const nextIds = nextStepIds(await allSteps(), current.id);
  const titles = await prisma.jobTitle.findMany({ where: { id: { in: nextIds } }, select: { id: true, name: true } });
  const next = await Promise.all(
    titles.map(async (t) => ({ jobTitle: t, profile: await skillProfileFor(userId, { id: t.id, name: t.name }) })),
  );
  next.sort((a, b) => (b.profile.readiness ?? 0) - (a.profile.readiness ?? 0));

  return { current, ladders, next };
}

/** Whether `targetId` is one rung above this person's current role. */
export async function isNextRole(userId: string, targetId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { jobTitleId: true } });
  if (!user?.jobTitleId) return false;
  return nextStepIds(await allSteps(), user.jobTitleId).includes(targetId);
}

export type SuccessionRole = {
  jobTitle: { id: string; name: string };
  holders: number;
  /** On a ladder at all; with no feeders, that means it is the bottom rung. */
  onLadder: boolean;
  feeders: string[];
  candidates: Candidate[];
};

/**
 * Every critical role, the people one rung below it, and how ready each is.
 *
 * Candidates come from the feeder roles on the ladders, not from the whole
 * company: succession planning is about the people already on the route, and a
 * list of everyone ranked against every role would be a league table nobody
 * asked for.
 */
export async function successionPlan(): Promise<SuccessionRole[]> {
  const [critical, steps] = await Promise.all([
    prisma.jobTitle.findMany({
      where: { isCritical: true },
      select: { id: true, name: true, _count: { select: { users: { where: { deletedAt: null, status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    }),
    allSteps(),
  ]);

  const roles: SuccessionRole[] = [];
  for (const role of critical) {
    const feeders = feederIds(steps, role.id);
    const people = feeders.length
      ? await prisma.user.findMany({
          where: { jobTitleId: { in: feeders }, deletedAt: null, status: "ACTIVE" },
          select: {
            id: true,
            fullName: true,
            jobTitle: { select: { name: true } },
            _count: { select: { developmentGoals: { where: { status: { in: ["PROPOSED", "APPROVED"] } } } } },
          },
        })
      : [];

    const candidates = await Promise.all(
      people.map(async (p) => {
        const profile = await skillProfileFor(p.id, { id: role.id, name: role.name });
        return {
          userId: p.id,
          fullName: p.fullName,
          currentTitle: p.jobTitle?.name ?? null,
          readiness: profile.readiness,
          gaps: profile.gaps.length,
          criticalGaps: profile.criticalGaps,
          unrated: profile.unrated,
          openGoals: p._count.developmentGoals,
        };
      }),
    );

    const feederNames = await prisma.jobTitle.findMany({ where: { id: { in: feeders } }, select: { name: true } });
    roles.push({
      jobTitle: { id: role.id, name: role.name },
      holders: role._count.users,
      onLadder: steps.some((s) => s.jobTitleId === role.id),
      feeders: feederNames.map((f) => f.name),
      candidates: rankCandidates(candidates),
    });
  }
  return roles;
}
