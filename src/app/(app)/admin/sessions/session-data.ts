import { prisma } from "@/lib/db";
import { localized } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";
import type { SessionFormValues } from "./session-form";

/** Reference lists shared by the create and edit screens. */
export async function loadSessionFormOptions(locale: Locale = "en") {
  const [courses, locations, instructors] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, titleAr: true, titleTr: true, code: true },
      take: 500,
    }),
    // Location carries no translated columns, so there is nothing to localise.
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Anyone with an account can be recorded as the instructor: internal
    // trainers are ordinary employees.
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, employeeCode: true },
      take: 1000,
    }),
  ]);

  return {
    courses: courses.map((c) => ({ id: c.id, name: `${c.code} — ${localized(c, "title", locale)}` })),
    locations: locations.map((l) => ({ id: l.id, name: l.name })),
    instructors: instructors.map((i) => ({ id: i.id, name: `${i.fullName} (${i.employeeCode})` })),
  };
}

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in local time, with no zone. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export function emptySessionValues(): SessionFormValues {
  // Next weekday morning, which is when training actually gets scheduled.
  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12, 0, 0, 0);

  return {
    title: "",
    titleAr: "",
    titleTr: "",
    description: "",
    courseId: "",
    startsAt: toLocalInput(start),
    endsAt: toLocalInput(end),
    mode: "IN_PERSON",
    locationId: "",
    room: "",
    meetingUrl: "",
    instructorId: "",
    instructorName: "",
    capacity: 20,
    waitlistEnabled: true,
    creditHours: "",
    notes: "",
  };
}
