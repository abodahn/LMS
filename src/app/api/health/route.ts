import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + database reachability for load balancers and deployment checks. */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    // How much of the catalogue has actually loaded. The import runs in the
    // background over several minutes and can be interrupted by a restart, so
    // "is it finished" is a real operational question — and without this the
    // only way to answer it is to log in and count, which a deploy check cannot
    // do. A published course count is not confidential.
    const courses = await prisma.course.count();
    return NextResponse.json({
      status: "ok",
      database: "ok",
      courses,
      latencyMs: Date.now() - started,
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.APP_VERSION ?? "1.0.0",
    });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
