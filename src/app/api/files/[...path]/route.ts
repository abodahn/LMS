import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readStored } from "@/lib/storage";

/**
 * Uploads live outside the web root. Every read checks that the caller either
 * owns the file or is allowed to verify proofs.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/files/[...path]">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { path: segments } = await params;
  const relative = segments.join("/");
  if (relative.includes("..")) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const proof = await prisma.externalCompletionProof.findFirst({
    where: { filePath: relative },
    include: { enrollment: { select: { userId: true } } },
  });
  if (!proof) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const allowed = proof.enrollment.userId === user.id || user.permissions.includes("proofs.verify");
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  try {
    const buffer = await readStored(relative);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": proof.mimeType,
        "content-disposition": `inline; filename="${encodeURIComponent(proof.fileName)}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
