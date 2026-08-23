import type { Metadata } from "next";
import { ExternalLink, Library } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatHours } from "@/lib/utils";
import {
  Badge,
  Card,
  EmptyState,
  SectionHeading,
  StatusPill,
} from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { EnrollButton } from "./enroll-button";

export const metadata: Metadata = { title: "Course Catalog" };

const PAGE_SIZE = 24;

export default async function CatalogPage({
  searchParams,
}: PageProps<"/catalog">) {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const level = typeof params.level === "string" ? params.level : "";
  const cost = typeof params.cost === "string" ? params.cost : "";
  const category = typeof params.category === "string" ? params.category : "";
  const lang = typeof params.lang === "string" ? params.lang : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    status: "PUBLISHED",
    stillAvailable: true,
    ...(level ? { aiLevel: { code: level } } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(cost === "free"
      ? { isFree: true }
      : cost === "paid"
        ? { isFree: false }
        : {}),
    // Each of these needs its own OR, and sibling ORs in one where-object
    // overwrite each other — so they go in as separate AND clauses.
    AND: [
      // "No approval needed" means nobody has to raise a budget line: the
      // course is free and so is its certificate.
      ...(cost === "noapproval"
        ? [
            {
              isFree: true,
              OR: [{ certificateCost: null }, { certificateCost: 0 }],
            },
          ]
        : []),
      // Taught in the language, or subtitled into it — an Arabic speaker can
      // follow an English course with Arabic subtitles.
      ...(lang
        ? [
            {
              OR: [
                { language: lang },
                { languages: { some: { language: lang } } },
              ],
            },
          ]
        : []),
      ...(q
        ? [
            {
              OR: [
                { title: { contains: q } },
                { titleAr: { contains: q } },
                { titleTr: { contains: q } },
                { description: { contains: q } },
                { descriptionAr: { contains: q } },
                { descriptionTr: { contains: q } },
                { provider: { name: { contains: q } } },
              ],
            },
          ]
        : []),
    ],
  };

  const [levels, categories, total, courses, enrollments] = await Promise.all([
    prisma.skillLevel.findMany({ orderBy: { order: "asc" } }),
    prisma.courseCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: { provider: true, aiLevel: true, category: true },
      orderBy: [{ isRecommended: "desc" }, { title: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true, id: true, status: true },
    }),
  ]);

  const enrolled = new Map(enrollments.map((e) => [e.courseId, e]));

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("nav.catalog")}
        subtitle={`${total} ${t("common.courses").toLowerCase()} · ${t("learning.browseCatalog")}`}
      />

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "lang",
            label: t("common.language"),
            value: lang,
            // Endonyms on purpose: a language is easiest to recognise written
            // in its own script, whatever interface language you are using.
            options: [
              { value: "en", label: "English" },
              { value: "ar", label: "العربية" },
              { value: "tr", label: "Türkçe" },
            ],
          },
          {
            name: "level",
            label: t("common.level"),
            value: level,
            options: levels.map((l) => ({
              value: l.code,
              label: `${l.code} — ${localized(l, "name", locale)}`,
            })),
          },
          {
            name: "category",
            label: t("common.filter"),
            value: category,
            options: categories.map((c) => ({
              value: c.id,
              label: t(`category.${c.key}`),
            })),
          },
          {
            name: "cost",
            label: t("common.status"),
            value: cost,
            options: [
              { value: "free", label: t("common.free") },
              { value: "noapproval", label: t("common.noApproval") },
              { value: "paid", label: t("common.paid") },
            ],
          },
        ]}
      />

      {courses.length === 0 ? (
        <EmptyState
          title={t("common.noResults")}
          icon={<Library size={20} />}
        />
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {courses.map((c) => {
              const existing = enrolled.get(c.id);
              return (
                <li key={c.id}>
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-[15px] font-semibold leading-snug text-[var(--brand-ink)]">
                          {localized(c, "title", locale)}
                        </h2>
                        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
                          {c.provider.name} · {c.platform}
                        </p>
                      </div>
                      {c.isRecommended ? (
                        <Badge tone="brand">
                          {t("assessment.recommendedForYou")}
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">
                      {localized(c, "description", locale)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--brand-muted)]">
                      {c.aiLevel ? (
                        <Badge tone="muted">{c.aiLevel.code}</Badge>
                      ) : null}
                      <Badge tone="muted">
                        {t(`difficulty.${c.difficulty}`)}
                      </Badge>
                      <span>{formatHours(c.estimatedHours)}</span>
                      <span>
                        {c.isFree
                          ? t("common.free")
                          : `${c.price ?? ""} ${c.currency}`}
                      </span>
                      {c.certificateAvailable ? (
                        <span>· {t("certificates.title")}</span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      {existing ? (
                        <>
                          <StatusPill status={existing.status} />
                          <LinkButton
                            href={`/learning/${existing.id}`}
                            variant="secondary"
                            size="sm"
                          >
                            {t("common.view")}
                          </LinkButton>
                        </>
                      ) : (
                        <EnrollButton
                          courseId={c.id}
                          label={t("learning.enroll")}
                        />
                      )}
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] px-2 text-[13px] font-medium text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
                        >
                          {t("common.openExternal")}
                          <ExternalLink size={12} aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
        </>
      )}
    </div>
  );
}
