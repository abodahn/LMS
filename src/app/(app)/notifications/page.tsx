import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { MarkAllReadButton } from "./mark-all-read";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        title={t("notifications.title")}
        action={unread > 0 ? <MarkAllReadButton label={t("notifications.markAllRead")} /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState title={t("notifications.empty")} body={t("notifications.emptyBody")} icon={<Bell size={20} />} />
      ) : (
        <ul className="grid gap-2">
          {notifications.map((n) => {
            const body = (
              <Card
                className={`p-4 transition-colors ${!n.isRead ? "border-s-[3px] border-s-[var(--brand-red)]" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--brand-ink)]">{n.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">{n.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone="muted">{t(`notifications.category${n.category}`)}</Badge>
                    <span className="text-[12px] text-[var(--brand-muted)]">
                      {formatDateTime(n.createdAt, locale)}
                    </span>
                  </div>
                </div>
              </Card>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
