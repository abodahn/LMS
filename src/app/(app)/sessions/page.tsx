import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { SessionCard, type SessionCardData } from "./session-card";

export const metadata: Metadata = { title: "Training Sessions" };

/**
 * What a learner sees of instructor-led training.
 *
 * Sessions they hold a place in come first regardless of date, because that is
 * the thing they need to act on; the open schedule follows. Past sessions stay
 * visible so an employee can point at what they attended.
 */
export default async function SessionsPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const now = new Date();

  const [sessions, mine] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { OR: [{ status: "SCHEDULED" }, { registrations: { some: { userId: user.id } } }] },
      include: {
        course: true,
        location: true,
        instructor: { select: { fullName: true } },
        _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
      },
      orderBy: { startsAt: "asc" },
      take: 100,
    }),
    prisma.sessionRegistration.findMany({ where: { userId: user.id } }),
  ]);

  const byId = new Map(mine.map((r) => [r.sessionId, r]));

  const toCard = (s: (typeof sessions)[number]): SessionCardData => {
    const registration = byId.get(s.id);
    return {
      id: s.id,
      title: localized(s, "title", locale),
      description: localized(s, "description", locale) || null,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      when: `${formatDateTime(s.startsAt, locale)} — ${formatDateTime(s.endsAt, locale)}`,
      mode: s.mode,
      room: s.room,
      locationName: s.location?.name ?? null,
      meetingUrl: s.meetingUrl,
      instructorName: s.instructor?.fullName ?? s.instructorName,
      capacity: s.capacity,
      taken: s._count.registrations,
      status: s.status,
      courseTitle: s.course ? localized(s.course, "title", locale) : null,
      mine:
        registration && registration.status !== "CANCELLED"
          ? { status: registration.status, waitlistOrder: registration.waitlistOrder }
          : null,
      past: s.endsAt.getTime() < now.getTime(),
    };
  };

  const cards = sessions.map(toCard);
  const booked = cards.filter((c) => c.mine && !c.past);
  const open = cards.filter((c) => !c.mine && !c.past && c.status === "SCHEDULED");
  const past = cards.filter((c) => c.past);

  return (
    <div className="space-y-6">
      <SectionHeading title={t("sessions.title")} subtitle={t("sessions.subtitle")} />

      {cards.length === 0 ? (
        <EmptyState title={t("sessions.noSessions")} icon={<CalendarDays size={20} />} />
      ) : null}

      {booked.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("sessions.mySessions")}</h2>
          <ul className="grid gap-3">
            {booked.map((s) => (
              <li key={s.id}>
                <SessionCard session={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {open.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("sessions.upcoming")}</h2>
          <ul className="grid gap-3">
            {open.map((s) => (
              <li key={s.id}>
                <SessionCard session={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("sessions.past")}</h2>
          <ul className="grid gap-3">
            {past.slice(0, 20).map((s) => (
              <li key={s.id}>
                <SessionCard session={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
