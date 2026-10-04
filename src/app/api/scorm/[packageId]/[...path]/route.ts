import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STORAGE_ROOT } from "@/lib/storage-root";
import { safeEntryPath } from "@/lib/scorm/paths";
import { bridgeHtml, isScormHost, scormOrigin, verifyLaunch } from "@/lib/scorm/origin";

/**
 * Serves the files of an unpacked SCORM package.
 *
 * The caller must be signed in and either enrolled in the course the package
 * belongs to or able to manage the catalogue — an administrator has to be able
 * to preview a package before assigning it to anyone.
 *
 * With SCORM_CONTENT_ORIGIN configured (lib/scorm/origin.ts) packages are
 * served only on that second hostname, admitted by a signed launch segment
 * instead of the session cookie, which does not reach that hostname at all.
 * Without it they are same-origin, as before. Either way the response headers
 * contain what they can: no sniffing, no framing by anyone else, no referrer
 * leakage, and a CSP that stops a package phoning home or loading anything
 * from outside itself.
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

function appOrigin() {
  const app = process.env.APP_URL?.replace(/\/+$/, "").trim();
  return app ? new URL(app).origin : "'none'";
}

export async function GET(request: Request, { params }: RouteContext<"/api/scorm/[packageId]/[...path]">) {
  const { packageId, path: all } = await params;
  const notFound = () => NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Separate hostname configured: the token is the only way in, and only there.
  const separate = scormOrigin();
  let userId: string | null;
  let canManage = false;
  let segments = all;
  if (separate) {
    if (!isScormHost(request.headers)) return notFound();
    userId = verifyLaunch(all[0] ?? "", packageId);
    if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    segments = all.slice(1);
    const holder = await prisma.user.findFirst({ where: { id: userId, deletedAt: null, status: "ACTIVE" } });
    if (!holder) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  } else {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    userId = user.id;
    canManage = user.permissions.includes("catalog.manage");
  }

  const pkg = await prisma.scormPackage.findUnique({
    where: { id: packageId },
    select: { storagePath: true, entryHref: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!pkg) return notFound();

  // A signed launch was issued only to someone allowed to open the lesson
  // (an enrolled learner, or a catalogue manager previewing it), so on the
  // separate hostname the signature is the permission check.
  const allowed =
    !!separate ||
    canManage ||
    (await prisma.enrollment.count({
      where: { userId, courseId: pkg.lesson.module.courseId },
    })) > 0;
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (separate && segments.length === 1 && segments[0] === "~bridge") {
    const app = (process.env.APP_URL?.replace(/\/+$/, "") || "").trim();
    if (!app) return notFound();
    return new NextResponse(bridgeHtml(new URL(app).origin, pkg.entryHref.split("/").map(encodeURIComponent).join("/")), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        // Embedded only by the academy itself; the bridge script is ours.
        "content-security-policy": `default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors ${new URL(app).origin}; base-uri 'none'; form-action 'none'`,
      },
    });
  }

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
        // In bridge mode the content's ancestors are the bridge (same host)
        // and the academy page above it; frame-ancestors checks every one.
        "content-security-policy": separate ? CSP.replace("frame-ancestors 'self'", `frame-ancestors 'self' ${appOrigin()}`) : CSP,
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
