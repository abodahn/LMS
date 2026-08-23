"use client";

import { useState, useTransition } from "react";
import { CalendarDays, MapPin, User, Video, Users } from "lucide-react";
import { Badge, Card, StatusPill } from "@/components/ui/primitives";
import { Button, LinkButton } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { registerAction, cancelSeatAction, type SessionActionState } from "./actions";

export type SessionCardData = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  when: string;
  mode: string;
  room: string | null;
  locationName: string | null;
  meetingUrl: string | null;
  instructorName: string | null;
  capacity: number;
  taken: number;
  status: string;
  courseTitle: string | null;
  /** The signed-in learner's own registration, if any. */
  mine: { status: string; waitlistOrder: number | null } | null;
  past: boolean;
};

const MODE_KEY: Record<string, string> = {
  IN_PERSON: "sessions.modeInPerson",
  ONLINE: "sessions.modeOnline",
  HYBRID: "sessions.modeHybrid",
};

export function SessionCard({ session }: { session: SessionCardData }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [state, setState] = useState<SessionActionState>({});

  const holdsSeat = session.mine?.status === "REGISTERED" || session.mine?.status === "ATTENDED";
  const waiting = session.mine?.status === "WAITLISTED";
  const full = session.taken >= session.capacity;
  const cancelled = session.status === "CANCELLED";

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[var(--brand-ink)]">{session.title}</h3>
          <Badge>{t(MODE_KEY[session.mode] ?? "sessions.modeInPerson")}</Badge>
          {cancelled ? <StatusPill status="CANCELLED" label={t("sessions.cancelled")} /> : null}
          {session.mine ? <StatusPill status={session.mine.status} /> : null}
        </div>

        {session.courseTitle ? (
          <p className="mt-1 text-[12px] text-[var(--brand-muted)]">{session.courseTitle}</p>
        ) : null}

        <ul className="mt-2 space-y-1 text-[13px] text-[var(--brand-muted)]">
          <li className="flex items-center gap-1.5">
            <CalendarDays size={13} aria-hidden />
            {session.when}
          </li>
          {session.room || session.locationName ? (
            <li className="flex items-center gap-1.5">
              <MapPin size={13} aria-hidden />
              {[session.locationName, session.room].filter(Boolean).join(" · ")}
            </li>
          ) : null}
          {session.instructorName ? (
            <li className="flex items-center gap-1.5">
              <User size={13} aria-hidden />
              {session.instructorName}
            </li>
          ) : null}
          <li className="flex items-center gap-1.5">
            <Users size={13} aria-hidden />
            {t("sessions.seats", { taken: String(session.taken), capacity: String(session.capacity) })}
            {full ? ` · ${t("sessions.full")}` : ""}
          </li>
          {waiting && session.mine?.waitlistOrder ? (
            <li>{t("sessions.waitlistPosition", { position: String(session.mine.waitlistOrder) })}</li>
          ) : null}
        </ul>

        {state.error ? (
          <p className="mt-2 text-[13px] text-[var(--brand-red)]">{t(state.error, state.params)}</p>
        ) : null}
        {state.success ? (
          <p className="mt-2 text-[13px] text-[var(--brand-success)]">{t(state.success)}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {holdsSeat && session.meetingUrl && !session.past ? (
          <LinkButton href={session.meetingUrl} variant="secondary" size="sm">
            <Video size={15} />
            {t("sessions.joinOnline")}
          </LinkButton>
        ) : null}

        {holdsSeat && !session.past ? (
          <LinkButton href={`/api/sessions/${session.id}/calendar`} variant="secondary" size="sm">
            <CalendarDays size={15} />
            {t("sessions.addToCalendar")}
          </LinkButton>
        ) : null}

        {!session.past && !cancelled ? (
          session.mine && session.mine.status !== "CANCELLED" ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => start(async () => setState(await cancelSeatAction(session.id)))}
            >
              {pending ? t("common.saving") : t("sessions.cancelSeat")}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => start(async () => setState(await registerAction(session.id)))}
            >
              {pending ? t("common.saving") : t("sessions.register")}
            </Button>
          )
        ) : null}
      </div>
    </Card>
  );
}
