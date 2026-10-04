import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAuth, page, paged } from "@/lib/api-keys";

/** Everyone, for matching against an HR or payroll system. `since` = changed since. */
export async function GET(request: Request) {
  const auth = await apiAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { limit, cursor, since } = page(request);

  const rows = await prisma.user.findMany({
    where: since ? { updatedAt: { gte: since } } : {},
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      employeeCode: true,
      email: true,
      fullName: true,
      status: true,
      deletedAt: true,
      updatedAt: true,
      department: { select: { code: true, name: true } },
      jobTitle: { select: { name: true } },
      manager: { select: { employeeCode: true } },
    },
  });
  const { data, nextCursor } = paged(rows, limit);
  return NextResponse.json({
    data: data.map((u) => ({
      id: u.id,
      employeeCode: u.employeeCode,
      email: u.email,
      fullName: u.fullName,
      status: u.deletedAt ? "REMOVED" : u.status,
      department: u.department,
      jobTitle: u.jobTitle?.name ?? null,
      managerEmployeeCode: u.manager?.employeeCode ?? null,
      updatedAt: u.updatedAt.toISOString(),
    })),
    nextCursor,
  });
}
