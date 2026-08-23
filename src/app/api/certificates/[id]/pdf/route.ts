import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderCertificatePdf } from "@/lib/certificates";

export async function GET(_request: Request, { params }: RouteContext<"/api/certificates/[id]/pdf">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { id } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { id }, select: { userId: true, code: true } });
  if (!certificate) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Own certificate, or an administrator managing certificates.
  const allowed = certificate.userId === user.id || user.permissions.includes("certificates.manage");
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const bytes = await renderCertificatePdf(id);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${certificate.code}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
