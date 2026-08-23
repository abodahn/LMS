import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STORAGE_ROOT } from "@/lib/storage-root";
import { safeEntryPath } from "@/lib/scorm/paths";

/**
 * Serves the files of an unpacked SCORM package.
 *
 * The caller must be signed in and either enrolled in the course the package
 * belongs to or able to manage the catalogue — an administrator has to be able
 * to preview a package before assigning it to anyone.
 *
 * This content is same-origin by necessity (see lib/scorm/package.ts), so the
 * response headers do the containment that an origin boundary would otherwise
 * do: no sniffing, no framing by anyone else, no referrer leakage, and a CSP
 * that stops a package phoning home or loading anything from outside itself.
 */

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".vtt": "text/vtt",
  ".swf": "application/x-shockwave-flash",
};

/**
 * `'unsafe-inline'` and `'unsafe-eval'` are unavoidable: authoring tools emit
 * inline handlers and, in Captivate's case, eval. What matters is `default-src
 * 'self'`, which keeps a package from reaching any other host.
 */
const CSP = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
  "style-src 'self' 'unsafe-inline' data:",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

export async function GET(_request: Request, { params }: RouteContext<"/api/scorm/[packageId]/[...path]">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { packageId, path: segments } = await params;

  const pkg = await prisma.scormPackage.findUnique({
    where: { id: packageId },
    select: { storagePath: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!pkg) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const allowed =
    user.permissions.includes("catalog.manage") ||
    (await prisma.enrollment.count({
      where: { userId: user.id, courseId: pkg.lesson.module.courseId },
    })) > 0;
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const root = path.resolve(STORAGE_ROOT, pkg.storagePath);
  let file: string;
  try {
    // Same guard as the unpacker: a request path may not leave the package.
    file = safeEntryPath(root, segments.map((s) => decodeURIComponent(s)).join("/"));
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  try {
    const buffer = await readFile(file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "content-security-policy": CSP,
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
