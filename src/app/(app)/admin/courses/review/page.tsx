import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatHours } from "@/lib/utils";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { ReviewForm } from "./review-form";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "review.title") };
}

const PAGE = 50;

/**
 * Courses discovery has proposed and nobody has decided on yet.
 *
 * Nothing here is visible to employees: the catalogue, the recommendation
 * engine and the skill mapping all read PUBLISHED only. The queue is the gate.
 */
export default async function ReviewQueuePage({ searchParams }: PageProps<"/admin/courses/review">) {
  await requirePermission("catalog.verify");
  const params = await searchParams;
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const source = typeof params.source === "string" ? params.source : "";
  // "none" selects courses with no recorded source; an empty value is "all".
  const where = {
    status: "PENDING_REVIEW",
    ...(source ? { sourceKey: source === "none" ? null : source } : {}),
  };

  const [rows, bySource] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: [{ discoveredAt: "asc" }, { title: "asc" }],
      take: PAGE,
      include: { provider: { select: { name: true } }, category: { select: { key: true } } },
    }),
    prisma.course.groupBy({ by: ["sourceKey"], where: { status: "PENDING_REVIEW" }, _count: { _all: true } }),
  ]);
  const total = bySource.reduce((sum, s) => sum + s._count._all, 0);
  const inView = source
    ? (bySource.find((s) => (s.sourceKey ?? "none") === source)?._count._all ?? 0)
    : total;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" aria-hidden />
        {t("admin.catalog")}
      </Link>

      <SectionHeading title={t("review.title")} subtitle={t("review.intro", { count: total })} />

      {bySource.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label={t("review.bySource")}>
          <Link
            href="/admin/courses/review"
            aria-current={source ? undefined : "page"}
            className="rounded-[var(--radius-pill)] border border-[var(--brand-line)] px-3 py-1 text-[12px] aria-[current=page]:bg-[var(--brand-canvas)] aria-[current=page]:font-medium"
          >
            {t("common.all")} ({total})
          </Link>
          {bySource.map((s) => (
            <Link
              key={s.sourceKey ?? "none"}
              href={`/admin/courses/review?source=${encodeURIComponent(s.sourceKey ?? "none")}`}
              aria-current={source === (s.sourceKey ?? "none") ? "page" : undefined}
              className="rounded-[var(--radius-pill)] border border-[var(--brand-line)] px-3 py-1 text-[12px] aria-[current=page]:bg-[var(--brand-canvas)] aria-[current=page]:font-medium"
            >
              {s.sourceKey ?? "—"} ({s._count._all})
            </Link>
          ))}
        </nav>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={t("review.empty")} icon={<Inbox size={20} />} />
      ) : (
        <>
          <ReviewForm
            key={source || "all"}
            rows={rows.map((c) => ({
              id: c.id,
              title: c.title,
              altTitle: locale === "tr" ? c.titleTr : locale === "ar" ? c.titleAr : (c.titleAr ?? c.titleTr),
              url: c.url,
              provider: c.provider.name,
              source: c.sourceKey ?? "—",
              language: c.language,
              hours: formatHours(c.estimatedHours),
              certificate: c.certificateAvailable,
              contentType: t(`review.type.${c.contentType}`),
              category: c.category ? t(`category.${c.category.key}`) : null,
              attribution: c.attribution,
              editHref: `/admin/courses/${c.id}`,
            }))}
          />
          {inView > rows.length ? (
            <p className="text-[12px] text-[var(--brand-muted)]">{t("review.moreWaiting", { count: inView - rows.length })}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
