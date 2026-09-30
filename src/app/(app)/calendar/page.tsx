import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { can, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { calendarFor, groupByMonth } from "@/lib/calendar";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "calendar.title") };
}

const TONE: Record<string, string> = {
  DEADLINE: "var(--brand-red)",
  SESSION: "var(--brand-info)",
  EXPIRY: "var(--brand-warning)",
  GOAL: "var(--brand-success)",
};

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const user = await requireUser();
  const params = await searchParams;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  // The team view needs the same permission as every other team screen. Being
  // somebody's recorded manager is not enough on its own: an import sets that
  // link whatever role the person holds, and a manager who is demoted keeps it —
  // without this check they would lose /team and keep their reports' deadlines,
  // certificate expiries and development goals here.
  const mayViewTeam = can(user, "team.view");
  const reports = mayViewTeam
    ? await prisma.user.findMany({ where: { managerId: user.id, deletedAt: null }, select: { id: true } })
    : [];
  const wantsTeam = params.scope === "team" && reports.length > 0;
  const userIds = wantsTeam ? reports.map((r) => r.id) : [user.id];

  // A report's own pages are theirs — /learning/{id} is not found for anyone
  // else and /skills shows the viewer's own — so in the team view every item
  // opens that person's page under /team instead.
  const items = (await calendarFor(userIds)).map((item) =>
    item.personId === user.id ? item : { ...item, href: `/team/${item.personId}` },
  );
  const months = groupByMonth(items);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading title={t("calendar.title")} subtitle={t("calendar.intro")} />

      {reports.length > 0 ? (
        <div className="flex gap-2">
          <Link
            href="/calendar"
            aria-current={wantsTeam ? undefined : "page"}
            className="rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 py-1.5 text-[13px] aria-[current=page]:font-medium"
            style={{ background: wantsTeam ? "transparent" : "var(--brand-canvas)" }}
          >
            {t("calendar.mine")}
          </Link>
          <Link
            href="/calendar?scope=team"
            aria-current={wantsTeam ? "page" : undefined}
            className="rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 py-1.5 text-[13px] aria-[current=page]:font-medium"
            style={{ background: wantsTeam ? "var(--brand-canvas)" : "transparent" }}
          >
            {t("calendar.team")}
          </Link>
        </div>
      ) : null}

      {months.length === 0 ? (
        <EmptyState title={t("calendar.nothing")} icon={<CalendarDays size={20} />} />
      ) : (
        months.map((month) => (
          <section key={month.key}>
            <h2 className="section-title mb-2">
              {month.at.toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "tr" ? "tr-TR" : "en-GB", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <Card className="p-0">
              <ul>
                {month.items.map((item) => (
                  <li key={item.id} className="border-b border-[var(--brand-line)] last:border-b-0">
                    <Link
                      href={item.href}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 hover:bg-[var(--brand-canvas)]"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-6 w-[3px] shrink-0 rounded-full"
                          style={{ background: TONE[item.kind] }}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-[var(--brand-ink)]">
                            {localized(item, "title", locale)}
                          </span>
                          <span className="text-[12px] text-[var(--brand-muted)]">
                            {t(`calendar.kind.${item.kind}`)}
                            {wantsTeam ? ` · ${item.personName}` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-[12px] tabular-nums">
                        {item.overdue ? (
                          <span className="rounded-[3px] bg-[var(--brand-red-soft)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[var(--brand-red)]">
                            {t("calendar.overdue")}
                          </span>
                        ) : null}
                        <span className="text-[var(--brand-muted)]">{formatDate(item.at, locale)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
