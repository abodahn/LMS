import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAuth, page, paged } from "@/lib/api-keys";

/** Completed courses. `since` = completed on or after. */
export async function GET(request: Request) {
  const auth = await apiAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { limit, cursor, since } = page(request);

  const rows = await prisma.enrollment.findMany({
    where: { status: "COMPLETED", ...(since ? { completedAt: { gte: since } } : {}) },
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      completedAt: true,
      user: { select: { id: true, employeeCode: true, email: true } },
      course: { select: { id: true, slug: true, title: true, estimatedHours: true } },
    },
  });
  const { data, nextCursor } = paged(rows, limit);
  return NextResponse.json({
    data: data.map((e) => ({
      enrollmentId: e.id,
      completedAt: e.completedAt?.toISOString() ?? null,
      employee: e.user,
      course: e.course,
    })),
    nextCursor,
  });
}
