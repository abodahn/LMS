import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus, Sparkles, TriangleAlert, Upload } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { aiAvailable } from "@/lib/ai/provider";
import { prisma } from "@/lib/db";
import { needsCourseReview } from "@/lib/analytics";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate, formatHours } from "@/lib/utils";
import { Badge, EmptyState, SectionHeading, StatusPill, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { DownloadLink } from "@/components/download-link";

export const metadata: Metadata = { title: "Course catalog" };

const PAGE_SIZE = 25;

export default async function AdminCoursesPage({ searchParams }: PageProps<"/admin/courses">) {
  const admin = await requirePermission("catalog.view");
  const aiEnabled = await aiAvailable();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const provider = typeof params.provider === "string" ? params.provider : "";
  const review = params.review === "1";
  const lang = typeof params.lang === "string" ? params.lang : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(provider ? { providerId: provider } : {}),
    // Separate AND clauses: two sibling ORs in one where-object overwrite each other.
    AND: [
      ...(lang ? [{ OR: [{ language: lang }, { languages: { some: { language: lang } } }] }] : []),
      ...(q
        ? [
            {
              OR: [
                { title: { contains: q } },
                { titleAr: { contains: q } },
                { titleTr: { contains: q } },
                { code: { contains: q } },
                { description: { contains: q } },
              ],
            },
          ]
        : []),
    ],
  };

  const [providers, total, courses] = await Promise.all([
    // Only providers that carry something, biggest first: 958 exist and most
    // hold a single video, which makes an alphabetical select of all of them
    // useless for finding anything.
    prisma.courseProvider.findMany({
      where: { courses: { some: {} } },
      select: { id: true, name: true, _count: { select: { courses: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: { provider: true, aiLevel: true, _count: { select: { enrollments: true } } },
      orderBy: { title: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const stale = new Set(courses.filter(needsCourseReview).map((c) => c.id));
  const needsReview = (c: (typeof courses)[number]) => stale.has(c.id);
  const visible = review ? courses.filter(needsReview) : courses;

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.catalog")}
        subtitle={`${total} ${t("common.courses").toLowerCase()}`}
        action={
          <>
            <LinkButton href="/admin/courses/import" variant="secondary" size="sm">
              <Upload size={15} />
              {t("common.import")}
            </LinkButton>
            <DownloadLink href="/api/export/course-effectiveness">
              <Download size={15} />
              {t("common.exportExcel")}
            </DownloadLink>
            {aiEnabled && admin.permissions.includes("catalog.manage") ? (
              <LinkButton href="/admin/courses/ai" variant="secondary" size="sm">
                <Sparkles size={15} />
                {t("ai.draftCourse")}
              </LinkButton>
            ) : null}
            <LinkButton href="/admin/courses/new" size="sm">
              <Plus size={15} />
              {t("common.create")}
            </LinkButton>
          </>
        }
      />

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "lang",
            label: t("common.language"),
            value: lang,
            options: [
              { value: "en", label: "English" },
              { value: "ar", label: "العربية" },
              { value: "tr", label: "Türkçe" },
            ],
          },
          {
            name: "status",
            label: t("common.status"),
            value: status,
            options: [
              { value: "PUBLISHED", label: t("common.published") },
              { value: "DRAFT", label: t("common.draft") },
              { value: "ARCHIVED", label: t("common.archived") },
            ],
          },
          {
            name: "provider",
            label: t("form.provider"),
            value: provider,
            options: providers
              .slice()
              .sort((a, b) => b._count.courses - a._count.courses)
              .map((p) => ({ value: p.id, label: `${p.name} (${p._count.courses})` })),
          },
          {
            name: "review",
            label: t("admin.needsReview"),
            value: review ? "1" : "",
            options: [{ value: "1", label: t("common.yes") }],
          },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.course")}</th>
                <th>{t("form.provider")}</th>
                <th>{t("common.level")}</th>
                <th>{t("common.hours")}</th>
                <th>{t("common.employees")}</th>
                <th>{t("common.status")}</th>
                <th>{t("form.verified")}</th>
                <th className="text-end">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">{c.title}</span>
                    <span className="block font-mono text-[11px] text-[var(--brand-muted)]">{c.code}</span>
                  </td>
                  <td className="text-[13px]">
                    {c.provider.name}
                    {c.isInternal ? (
                      <Badge tone="brand" className="ms-2">
                        Internal
                      </Badge>
                    ) : null}
                  </td>
                  <td>{c.aiLevel?.code ?? "—"}</td>
                  <td className="tabular-nums">{formatHours(c.estimatedHours)}</td>
                  <td className="tabular-nums">{c._count.enrollments}</td>
                  <td>
                    <StatusPill status={c.status} />
                  </td>
                  <td className="text-[13px] text-[var(--brand-muted)]">
                    {needsReview(c) ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--brand-warning)]">
                        <TriangleAlert size={13} aria-hidden />
                        {t("admin.needsReview")}
                      </span>
                    ) : (
                      formatDate(c.lastVerifiedAt, locale)
                    )}
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {!review ? <Pagination page={page} pageSize={PAGE_SIZE} total={total} /> : null}
        </>
      )}
    </div>
  );
}
