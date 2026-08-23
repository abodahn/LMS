import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { SectionHeading, StatCard } from "@/components/ui/primitives";
import { SessionForm } from "../session-form";
import { Roster, type RosterRow } from "../roster";
import { loadSessionFormOptions, toLocalInput } from "../session-data";

export const metadata: Metadata = { title: "Session" };

export default async function SessionPage({ params }: PageProps<"/admin/sessions/[sessionId]">) {
  await requirePermission("sessions.manage");
  const { sessionId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [session, options] = await Promise.all([
    prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        registrations: {
          include: { user: { select: { fullName: true, employeeCode: true, department: true } } },
          orderBy: [{ status: "asc" }, { waitlistOrder: "asc" }],
        },
      },
    }),
    loadSessionFormOptions(locale),
  ]);
  if (!session) notFound();

  const rows: RosterRow[] = session.registrations.map((r) => ({
    userId: r.userId,
    name: r.user.fullName,
    employeeCode: r.user.employeeCode,
    department: r.user.department ? localized(r.user.department, "name", locale) : null,
    status: r.status,
    waitlistOrder: r.waitlistOrder,
  }));

  const seated = rows.filter((r) => r.status === "REGISTERED" || r.status === "ATTENDED").length;
  const attended = rows.filter((r) => r.status === "ATTENDED").length;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/sessions"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("sessions.title")}
      </Link>

      <SectionHeading
        title={localized(session, "title", locale)}
        subtitle={`${formatDateTime(session.startsAt, locale)} — ${formatDateTime(session.endsAt, locale)}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("sessions.capacity")} value={`${seated} / ${session.capacity}`} />
        <StatCard label={t("sessions.attended")} value={attended} />
        <StatCard
          label={t("common.status")}
          value={session.status}
          tone={session.status === "CANCELLED" ? "warning" : "neutral"}
        />
      </div>

      <Roster
        sessionId={session.id}
        rows={rows}
        cancelled={session.status === "CANCELLED"}
        linkedCourse={session.course ? localized(session.course, "title", locale) : null}
      />

      <SectionHeading title={t("sessions.editSession")} />
      <SessionForm
        values={{
          id: session.id,
          title: session.title,
          titleAr: session.titleAr ?? "",
          titleTr: session.titleTr ?? "",
          description: session.description ?? "",
          courseId: session.courseId ?? "",
          startsAt: toLocalInput(session.startsAt),
          endsAt: toLocalInput(session.endsAt),
          mode: session.mode,
          locationId: session.locationId ?? "",
          room: session.room ?? "",
          meetingUrl: session.meetingUrl ?? "",
          instructorId: session.instructorId ?? "",
          instructorName: session.instructorName ?? "",
          capacity: session.capacity,
          waitlistEnabled: session.waitlistEnabled,
          creditHours: session.creditHours != null ? String(session.creditHours) : "",
          notes: session.notes ?? "",
        }}
        {...options}
      />
    </div>
  );
}
