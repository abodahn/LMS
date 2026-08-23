import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildReport, REPORTS, type ReportKey } from "@/lib/reports";
import { buildWorkbook, toCsv } from "@/lib/spreadsheet";
import { rateLimit } from "@/lib/rate-limit";

const PERMISSION: Partial<Record<ReportKey, string>> = {
  employees: "users.view",
  "employee-template": "users.import",
  "course-template": "catalog.manage",
  audit: "audit.view",
};

export async function GET(request: Request, { params }: RouteContext<"/api/export/[report]">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { report } = await params;
  const key = report as ReportKey;
  const known =
    key === "employees" ||
    key === "employee-template" ||
    key === "course-template" ||
    key === "audit" ||
    REPORTS.some((r) => r.key === key);
  if (!known) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const required = PERMISSION[key] ?? "reports.export";
  if (!user.permissions.includes(required as never)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Exports are expensive; a handful per minute per user is plenty.
  if (!rateLimit(`export:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const data = await buildReport(key);

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "REPORT_EXPORT",
    entity: "Report",
    entityId: key,
    summary: format,
  });

  if (format === "csv") {
    const sheet = data.sheets[0];
    return new NextResponse(`﻿${toCsv(sheet.columns, sheet.rows)}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${data.filename}.csv"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const buffer = await buildWorkbook(data.sheets, { title: data.filename });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${data.filename}.xlsx"`,
      "cache-control": "private, no-store",
    },
  });
}
