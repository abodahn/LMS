import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * The session as a calendar invitation.
 *
 * A training booking that does not appear in someone's calendar is a training
 * booking they miss. Only people holding a place may download it — the file
 * carries the room and the joining link.
 */

/** iCalendar escaping: commas, semicolons and backslashes are separators. */
const esc = (value: string) =>
  value.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Lines over 75 octets must be folded, or strict clients reject the file. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n ");
}

export async function GET(_request: Request, { params }: RouteContext<"/api/sessions/[sessionId]/calendar">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { sessionId } = await params;

  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { location: true, instructor: { select: { fullName: true } } },
  });
  if (!session) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const registration = await prisma.sessionRegistration.findUnique({
    where: { sessionId_userId: { sessionId, userId: user.id } },
  });
  const allowed =
    (registration && registration.status !== "CANCELLED") || user.permissions.includes("sessions.manage");
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const where = [session.location?.name, session.room].filter(Boolean).join(", ");
  const description = [
    session.description,
    session.instructor?.fullName ?? session.instructorName,
    session.meetingUrl,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//T&C AI Academy//Training//EN",
    "CALSCALE:GREGORIAN",
    // A cancelled session is published as a cancellation so it disappears from
    // the calendar rather than lingering as a meeting nobody attends.
    session.status === "CANCELLED" ? "METHOD:CANCEL" : "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${session.id}@tc-ai-academy`,
    `DTSTAMP:${stamp(new Date(session.updatedAt))}`,
    `DTSTART:${stamp(session.startsAt)}`,
    `DTEND:${stamp(session.endsAt)}`,
    fold(`SUMMARY:${esc(session.title)}`),
    where ? fold(`LOCATION:${esc(where)}`) : "",
    description ? fold(`DESCRIPTION:${esc(description)}`) : "",
    session.meetingUrl ? fold(`URL:${esc(session.meetingUrl)}`) : "",
    session.status === "CANCELLED" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="session-${session.id}.ics"`,
      "cache-control": "private, no-store",
    },
  });
}
