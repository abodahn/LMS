import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getI18n } from "@/lib/locale";
import { localized } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/**
 * Course search for pickers.
 *
 * Exists because the catalogue outgrew the native select. At ten thousand
 * courses, every form that let someone choose one shipped all ten thousand as
 * <option>s — over a megabyte of markup per select, and a list nobody could
 * scroll. The assign form had two of them.
 *
 * Only published, available courses, which is exactly what any signed-in
 * employee can already browse in the catalogue, so a signed-in session is the
 * whole check. Rate-limited because it is typed into.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!rateLimit(`course-search:${user.id}`, 120, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ courses: [] });

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      stillAvailable: true,
      OR: [
        { title: { contains: q } },
        { titleAr: { contains: q } },
        { titleTr: { contains: q } },
        { code: { contains: q } },
      ],
    },
    // Internal courses first: they are what an administrator assigns most, and
    // otherwise they drown under nine thousand external ones with similar names.
    orderBy: [{ isInternal: "desc" }, { title: "asc" }],
    select: { id: true, title: true, titleAr: true, titleTr: true, estimatedHours: true, isInternal: true },
    take: 20,
  });

  // In the viewer's language, like every other course title they see — the
  // chips a search adds sat beside localized ones otherwise.
  const { locale } = await getI18n();
  return NextResponse.json(
    {
      courses: courses.map((c) => ({
        id: c.id,
        title: localized(c, "title", locale),
        estimatedHours: c.estimatedHours,
        isInternal: c.isInternal,
      })),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
