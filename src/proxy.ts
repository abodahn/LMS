import { NextResponse, type NextRequest } from "next/server";
import { isScormHost } from "@/lib/scorm/origin";

/**
 * The SCORM content hostname serves package files and nothing else. Without
 * this, the whole academy — sign-in page included — would also answer there,
 * and a package could put a convincing copy of it in front of a learner on a
 * hostname that looks like ours.
 */
export function proxy(request: NextRequest) {
  if (isScormHost(request.headers) && !request.nextUrl.pathname.startsWith("/api/scorm/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}
