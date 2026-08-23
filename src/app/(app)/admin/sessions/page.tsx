import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, SectionHeading, StatusPill, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Training sessions" };

export default async function AdminSessionsPage() {
  await requirePermission("sessions.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const sessions = await prisma.trainingSession.findMany({
    include: {
      course: true,
      location: true,
      instructor: { select: { fullName: true } },
      _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
    },
    orderBy: { startsAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("sessions.title")}
        subtitle={`${sessions.length}`}
        action={
          <LinkButton href="/admin/sessions/new" size="sm">
            <Plus size={15} />
            {t("sessions.newSession")}
          </LinkButton>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState title={t("sessions.noSessions")} icon={<CalendarDays size={20} />} />
      ) : (
        <TableShell>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("form.title")}</th>
                <th>{t("sessions.startsAt")}</th>
                <th>{t("form.location")}</th>
                <th>{t("sessions.instructor")}</th>
                <th>{t("sessions.capacity")}</th>
                <th>{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link
                      href={`/admin/sessions/${s.id}`}
                      className="font-medium text-[var(--brand-ink)] underline-offset-4 hover:underline"
                    >
                      {localized(s, "title", locale)}
                    </Link>
                    {s.course ? (
                      <span className="block text-[12px] text-[var(--brand-muted)]">
                        {localized(s.course, "title", locale)}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-[13px]">{formatDateTime(s.startsAt, locale)}</td>
                  <td className="text-[13px]">
                    {[s.location?.name, s.room].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="text-[13px]">{s.instructor?.fullName ?? s.instructorName ?? "—"}</td>
                  <td className="tabular-nums text-[13px]">
                    {s._count.registrations} / {s.capacity}
                  </td>
                  <td>
                    <StatusPill status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
