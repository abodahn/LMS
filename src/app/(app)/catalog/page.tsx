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
import { JOB_FAMILIES } from "@/lib/constants";

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
  const duration = typeof params.duration === "string" ? params.duration : "";
  const provider = typeof params.provider === "string" ? params.provider : "";
  const certificate = typeof params.certificate === "string" ? params.certificate : "";
  const skill = typeof params.skill === "string" ? params.skill : "";
  const role = typeof params.role === "string" ? params.role : "";
  const type = typeof params.type === "string" ? params.type : "";
  const teaches = typeof params.teaches === "string" ? params.teaches : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  // Bands rather than a slider: nobody filters a catalogue by "between 3.5 and
  // 4.25 hours", they filter by whether it fits in a break or a morning.
  const DURATION: Record<string, { gte?: number; lt?: number }> = {
    under1: { lt: 1 },
    "1to4": { gte: 1, lt: 4 },
    "4to10": { gte: 4, lt: 10 },
    over10: { gte: 10 },
  };

  // Course type is read from the platform string, which is where the shape of a
  // resource actually lives today — a dedicated column belongs with the content
  // types in a later phase.
  const TYPE: Record<string, object> = {
    internal: { isInternal: true },
    path: { platform: { contains: "learning path" } },
    video: { platform: { contains: "YouTube" } },
    course: { isInternal: false, NOT: [{ platform: { contains: "YouTube" } }, { platform: { contains: "learning path" } }] },
  };

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
    ...(certificate === "yes" ? { certificateAvailable: true } : {}),
    ...(provider ? { providerId: provider } : {}),
    ...(duration && DURATION[duration] ? { estimatedHours: DURATION[duration] } : {}),
    ...(type && TYPE[type] ? TYPE[type] : {}),
    ...(skill ? { competencies: { some: { competency: { key: skill } } } } : {}),
    ...(role ? { jobFamilies: { some: { jobFamily: role } } } : {}),
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
      // The language a course *teaches*, which is not the language it is
      // taught in: Turkish for Arabic speakers is delivered in Arabic, so the
      // language filter below cannot find it and the two are not interchangeable.
      //
      // ponytail: read off the description, which the language harvest writes
      // as "Turkish · Beginner. …". A column of its own is the right home for
      // this, and is worth a migration only once something other than the
      // Languages category needs to know.
      ...(teaches ? [{ description: { startsWith: `${teaches} · ` } }] : []),
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
                { code: { contains: q } },
                { platform: { contains: q } },
                // Section 44: a search for "finance" should find the category,
                // and one for "prompting" should find the skill.
                { category: { name: { contains: q } } },
                { competencies: { some: { competency: { name: { contains: q } } } } },
                { jobFamilies: { some: { jobFamily: { contains: q } } } },
              ],
            },
          ]
        : []),
    ],
  };

  const [levels, categories, competencies, providers, total, courses, enrollments] = await Promise.all([
    prisma.skillLevel.findMany({ orderBy: { order: "asc" } }),
    prisma.courseCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.competency.findMany({ orderBy: { order: "asc" } }),
    // 958 providers exist and most carry a single YouTube video; a select of
    // everything would be unusable. Only those with a real body of content.
    prisma.courseProvider.findMany({
      where: { courses: { some: {} } },
      select: { id: true, name: true, _count: { select: { courses: true } } },
      orderBy: { name: "asc" },
    }),
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
            // Sits beside Language deliberately: one is the language you need
            // to understand the course, the other is the language you came to
            // learn, and seeing them together is what makes the difference read.
            name: "teaches",
            label: t("common.teaches"),
            value: teaches,
            options: [
              { value: "Turkish", label: "Türkçe" },
              { value: "English", label: "English" },
              { value: "Arabic", label: "العربية" },
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
            label: t("common.category"),
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
          {
            name: "duration",
            label: t("common.duration"),
            value: duration,
            secondary: true,
            options: [
              { value: "under1", label: t("common.under1") },
              { value: "1to4", label: t("common.1to4") },
              { value: "4to10", label: t("common.4to10") },
              { value: "over10", label: t("common.over10") },
            ],
          },
          {
            name: "type",
            label: t("common.courseType"),
            value: type,
            secondary: true,
            options: [
              { value: "internal", label: t("common.typeInternal") },
              { value: "course", label: t("common.typeCourse") },
              { value: "path", label: t("common.typePath") },
              { value: "video", label: t("common.typeVideo") },
            ],
          },
          {
            name: "skill",
            label: t("common.skill"),
            value: skill,
            secondary: true,
            options: competencies.map((c) => ({ value: c.key, label: localized(c, "name", locale) })),
          },
          {
            name: "role",
            label: t("common.jobRole"),
            value: role,
            secondary: true,
            options: JOB_FAMILIES.map((f) => ({ value: f, label: t(`jobFamily.${f}`) })),
          },
          {
            name: "provider",
            label: t("common.provider"),
            value: provider,
            secondary: true,
            // Ordered by how much each carries, so the meaningful ones are not
            // buried under hundreds of single-video channels.
            options: providers
              .slice()
              .sort((a, b) => b._count.courses - a._count.courses)
              .map((p) => ({ value: p.id, label: `${p.name} (${p._count.courses})` })),
          },
          {
            name: "certificate",
            label: t("common.certificate"),
            value: certificate,
            secondary: true,
            options: [{ value: "yes", label: t("common.withCertificate") }],
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
