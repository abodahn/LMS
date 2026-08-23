import type { Db } from "./client";

/**
 * Demo instructor-led training.
 *
 * Without this the sessions screens are empty on a fresh install and the
 * feature reads as broken rather than unused. The set below is deliberately a
 * story rather than filler: one session already run and registered against, one
 * filling up so the waiting list is visible, one online, and one cancelled — so
 * every state an administrator will meet is on screen before they create
 * anything of their own.
 *
 * Dates are relative to the seed run, so the schedule is never stale.
 */

const day = 86_400_000;

type SessionSeed = {
  key: string;
  title: string;
  titleAr: string;
  titleTr: string;
  description: string;
  courseCode?: string;
  /** Days from now; negative is in the past. */
  offsetDays: number;
  startHour: number;
  hours: number;
  mode: "IN_PERSON" | "ONLINE" | "HYBRID";
  room?: string;
  meetingUrl?: string;
  instructorCode?: string;
  instructorName?: string;
  capacity: number;
  status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  /** Employee codes with a seat, in order. Beyond capacity they queue. */
  attendees: string[];
  /** Who actually turned up, for a session already run. */
  attended?: string[];
};

const SESSIONS: SessionSeed[] = [
  {
    key: "AI-FLOOR-1",
    title: "AI on the production floor — hands-on workshop",
    titleAr: "الذكاء الاصطناعي في صالة الإنتاج — ورشة عملية",
    titleTr: "Üretim sahasında yapay zekâ — uygulamalı atölye",
    description:
      "A working session in the training room: bring a real task from your line and leave with it partly automated.",
    courseCode: "INT-AI-TC",
    offsetDays: -14,
    startHour: 9,
    hours: 3,
    mode: "IN_PERSON",
    room: "Training room A",
    instructorCode: "TC-0002",
    capacity: 12,
    attendees: ["TC-1001", "TC-1004", "TC-1005", "TC-2004"],
    attended: ["TC-1001", "TC-1004", "TC-2004"],
  },
  {
    key: "PROMPT-CLINIC",
    title: "Prompt clinic — bring your own problem",
    titleAr: "عيادة كتابة الأوامر — أحضر مشكلتك",
    titleTr: "İstem kliniği — kendi probleminizi getirin",
    description:
      "Ninety minutes of rewriting prompts that did not work. Small on purpose, so everyone gets their turn.",
    offsetDays: 5,
    startHour: 13,
    hours: 1.5,
    mode: "IN_PERSON",
    room: "Meeting room 2",
    instructorCode: "TC-0002",
    // Deliberately small: the waiting list is the thing worth seeing.
    capacity: 2,
    attendees: ["TC-1004", "TC-1005", "TC-1001", "TC-2004"],
  },
  {
    key: "RESPONSIBLE-AI",
    title: "Responsible AI briefing for managers",
    titleAr: "إحاطة عن الذكاء الاصطناعي المسؤول للمديرين",
    titleTr: "Yöneticiler için sorumlu yapay zekâ bilgilendirmesi",
    description:
      "What must never be pasted into a public tool, and who is accountable when a decision was AI-assisted.",
    courseCode: "INT-RAI-TC",
    offsetDays: 12,
    startHour: 10,
    hours: 1,
    mode: "ONLINE",
    meetingUrl: "https://teams.microsoft.com/l/meetup-join/tc-ai-academy-responsible-ai",
    instructorCode: "TC-0001",
    capacity: 40,
    attendees: ["TC-1001"],
  },
  {
    key: "EXCEL-AI",
    title: "Excel and AI for planning teams",
    titleAr: "الاكسل والذكاء الاصطناعي لفرق التخطيط",
    titleTr: "Planlama ekipleri için Excel ve yapay zekâ",
    description: "Postponed — the trainer is rescheduling. Kept here so the cancellation is visible.",
    offsetDays: 20,
    startHour: 9,
    hours: 4,
    mode: "HYBRID",
    room: "Training room A",
    instructorName: "Mona Adel (external)",
    capacity: 16,
    status: "CANCELLED",
    attendees: ["TC-1004"],
  },
];

export async function seedSessions(prisma: Db) {
  const now = Date.now();

  for (const seed of SESSIONS) {
    const start = new Date(now + seed.offsetDays * day);
    start.setHours(seed.startHour, 0, 0, 0);
    const end = new Date(start.getTime() + seed.hours * 3_600_000);

    const course = seed.courseCode
      ? await prisma.course.findUnique({ where: { code: seed.courseCode } })
      : null;
    const instructor = seed.instructorCode
      ? await prisma.user.findUnique({ where: { employeeCode: seed.instructorCode } })
      : null;
    const location = await prisma.location.findFirst();

    // Keyed on the title so re-seeding updates rather than duplicating; there is
    // no natural unique column on a session, and adding one for demo data alone
    // would be the wrong trade.
    const existing = await prisma.trainingSession.findFirst({ where: { title: seed.title } });

    const data = {
      title: seed.title,
      titleAr: seed.titleAr,
      titleTr: seed.titleTr,
      description: seed.description,
      courseId: course?.id ?? null,
      startsAt: start,
      endsAt: end,
      mode: seed.mode,
      locationId: seed.mode === "ONLINE" ? null : (location?.id ?? null),
      room: seed.room ?? null,
      meetingUrl: seed.meetingUrl ?? null,
      instructorId: instructor?.id ?? null,
      instructorName: seed.instructorName ?? null,
      capacity: seed.capacity,
      waitlistEnabled: true,
      status: seed.status ?? (end.getTime() < now ? "COMPLETED" : "SCHEDULED"),
      createdById: instructor?.id ?? null,
    };

    const session = existing
      ? await prisma.trainingSession.update({ where: { id: existing.id }, data })
      : await prisma.trainingSession.create({ data });

    await prisma.sessionRegistration.deleteMany({ where: { sessionId: session.id } });

    let seated = 0;
    let queued = 0;

    for (const code of seed.attendees) {
      const user = await prisma.user.findUnique({ where: { employeeCode: code } });
      if (!user) continue;

      const full = seated >= session.capacity;
      const status = seed.attended
        ? seed.attended.includes(code)
          ? "ATTENDED"
          : "ABSENT"
        : full
          ? "WAITLISTED"
          : "REGISTERED";

      if (full && !seed.attended) queued += 1;
      else seated += 1;

      await prisma.sessionRegistration.create({
        data: {
          sessionId: session.id,
          userId: user.id,
          status,
          waitlistOrder: status === "WAITLISTED" ? queued : null,
          attendanceAt: seed.attended ? end : null,
          attendanceById: seed.attended ? (instructor?.id ?? null) : null,
        },
      });
    }
  }

  return { sessions: SESSIONS.length };
}
