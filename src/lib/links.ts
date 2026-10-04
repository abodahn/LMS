import { prisma } from "./db";
import { isYouTubeUrl, youTubeOEmbedUrl } from "./youtube";
import { audit } from "./audit";

/**
 * Checks that the catalogue's external links still go where they claim.
 *
 * The schema has always carried `linkWorking`, `stillAvailable` and
 * `lastVerifiedAt`, and the recommendation engine already refuses to suggest a
 * course whose link is broken — but nothing wrote those fields except an
 * administrator opening a course and recording a review by hand. Past a
 * thousand external links that does not scale, and a catalogue quietly rots
 * into dead ends that the engine keeps recommending.
 *
 * Two different tests, because a 200 means different things per platform:
 *
 *  - YouTube answers 200 for a deleted video, with "unavailable" in the body.
 *    Its oEmbed endpoint answers 404 instead, so that is what gets called.
 *  - Everywhere else, a retired course redirects to a catalogue index. The
 *    status alone would pass; what is checked is that the request ends on the
 *    path it started on.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

/** Consecutive failures before a course is pulled from the catalogue. */
export const STRIKES_BEFORE_WITHDRAWAL = 3;

export type LinkVerdict = { ok: true } | { ok: false; reason: string };

const pathOf = (url: string) => new URL(url).pathname.replace(/\/+$/, "").toLowerCase();

export async function checkLink(url: string, signal?: AbortSignal): Promise<LinkVerdict> {
  try {
    if (isYouTubeUrl(url)) {
      const res = await fetch(youTubeOEmbedUrl(url), { headers: { "User-Agent": UA }, signal });
      // 404 for a deleted video, 400 for an id that never existed.
      if (res.status === 404 || res.status === 400) {
        return { ok: false, reason: "removed, private or not embeddable" };
      }
      if (!res.ok) return { ok: false, reason: `oEmbed HTTP ${res.status}` };
      return { ok: true };
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal,
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    // A redirect deeper into the same course is normal — several platforms send
    // /course straight to /course/chapter1. Leaving the path is not.
    if (!pathOf(res.url).startsWith(pathOf(url))) return { ok: false, reason: `redirected to ${res.url}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export type SweepResult = {
  checked: number;
  working: number;
  broken: number;
  withdrawn: number;
  recovered: number;
};

/**
 * Re-checks the courses whose review interval has elapsed.
 *
 * A single failure only records a strike, because a provider having a bad
 * minute should not empty the catalogue. Three consecutive failures withdraw
 * the course: it stops being recommended and stops being browsable, but stays
 * in the database with its enrolment history intact, and any successful check
 * puts it straight back.
 *
 * A failing course keeps its old `lastVerifiedAt` so it stays at the front of
 * the queue and is retried on the next run, rather than waiting out a review
 * interval that can be six months long.
 */
export async function sweepCourseLinks(
  options: { limit?: number; force?: boolean; pauseMs?: number } = {},
): Promise<SweepResult> {
  const limit = options.limit ?? 250;
  const pause = options.pauseMs ?? 150;
  const now = Date.now();

  const candidates = await prisma.course.findMany({
    // freeCodeCamp's terms forbid monitoring its site with a crawler, so its
    // links are never swept; their existence is checked against the public
    // curriculum repository when the catalogue is refreshed instead.
    //
    // The null case is spelled out: in SQL "not freeCodeCamp" is unknown for a
    // row with no source, and every course created in the admin form has none —
    // written the short way, those would silently never be checked again.
    where: {
      url: { not: null },
      stillAvailable: true,
      OR: [{ sourceKey: null }, { sourceKey: { not: "FREECODECAMP" } }],
      // By host as well: a freeCodeCamp course imported without a Source
      // column, or before there was one, is still freeCodeCamp's site.
      NOT: { url: { contains: "freecodecamp.org" } },
    },
    select: {
      id: true,
      code: true,
      url: true,
      lastVerifiedAt: true,
      reviewIntervalDays: true,
      linkWorking: true,
      linkFailCount: true,
    },
    // Never checked first, then longest since the last check.
    orderBy: [{ linkWorking: "asc" }, { lastVerifiedAt: { sort: "asc", nulls: "first" } }],
    take: limit * 2,
  });

  const due = candidates
    .filter(
      (c) =>
        options.force ||
        !c.lastVerifiedAt ||
        !c.linkWorking ||
        c.lastVerifiedAt.getTime() <= now - c.reviewIntervalDays * 86400000,
    )
    .slice(0, limit);

  const result: SweepResult = { checked: 0, working: 0, broken: 0, withdrawn: 0, recovered: 0 };

  for (const course of due) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const verdict = await checkLink(course.url!, controller.signal);
    clearTimeout(timeout);
    result.checked++;

    if (verdict.ok) {
      result.working++;
      if (!course.linkWorking) result.recovered++;
      await prisma.course.update({
        where: { id: course.id },
        data: {
          linkWorking: true,
          linkFailCount: 0,
          linkNote: null,
          lastVerifiedAt: new Date(),
        },
      });
    } else {
      result.broken++;
      const strikes = course.linkFailCount + 1;
      const withdraw = strikes >= STRIKES_BEFORE_WITHDRAWAL;

      await prisma.course.update({
        where: { id: course.id },
        data: {
          linkWorking: false,
          linkFailCount: strikes,
          linkNote: verdict.reason.slice(0, 300),
          ...(withdraw ? { stillAvailable: false, lastVerifiedAt: new Date() } : {}),
        },
      });

      if (withdraw) {
        result.withdrawn++;
        await audit({
          actorName: "link checker",
          action: "COURSE_WITHDRAWN_DEAD_LINK",
          entity: "Course",
          entityId: course.id,
          summary: `${course.code} withdrawn after ${strikes} failed checks: ${verdict.reason}`.slice(0, 500),
        });
      }
    }

    // Paced: a sweep of a thousand rows should not read as an attack to any
    // one provider.
    if (pause) await new Promise((r) => setTimeout(r, pause));
  }

  return result;
}
