import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAuth, page, paged } from "@/lib/api-keys";

/** Certificates, valid or not. `since` = issued on or after. */
export async function GET(request: Request) {
  const auth = await apiAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { limit, cursor, since } = page(request);

  const rows = await prisma.certificate.findMany({
    where: since ? { issuedAt: { gte: since } } : {},
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      code: true,
      type: true,
      title: true,
      courseId: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { id: true, employeeCode: true, email: true } },
    },
  });
  const { data, nextCursor } = paged(rows, limit);
  return NextResponse.json({
    data: data.map(({ user, ...c }) => ({
      ...c,
      issuedAt: c.issuedAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() ?? null,
      revokedAt: c.revokedAt?.toISOString() ?? null,
      employee: user,
    })),
    nextCursor,
  });
}
