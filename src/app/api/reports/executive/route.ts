import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { renderExecutiveReport } from "@/lib/executive-report";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!user.permissions.includes("analytics.executive")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (!rateLimit(`exec-report:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const bytes = await renderExecutiveReport();
  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "EXECUTIVE_REPORT_EXPORT",
    entity: "Report",
    entityId: "executive",
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="tc-ai-capability-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
