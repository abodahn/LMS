// No `server-only` guard here, matching lib/settings.ts and the recommendation
// service: importing prisma already keeps this off the client, and dropping the
// guard lets scripts/import-smoke.mts exercise the real import path.
import { z } from "zod";
import { prisma } from "../db";
import { ensureVideoLesson } from "./lessons";
import type { ParsedRow } from "../spreadsheet";
import { slugify } from "../utils";
import { COMPETENCY_KEYS, JOB_FAMILIES, LEARNING_GOALS, LOCALES } from "../constants";
import { list, matchDifficulty, matchEnum, matchLevel, norm, parseHours, parseWeighted, truthy, uniqueSlug } from "./parse";

/**
 * Bulk course import.
 *
 * A curated catalog of twenty courses can be typed in. A catalog of a thousand
 * cannot, and neither can it be kept current by hand when providers move,
 * rename and retire courses every quarter. This takes a provider export or an
 * L&D spreadsheet and loads it, validating every row first.
 *
 * The fields that drive the recommendation engine — level, competencies,
 * departments, job families, goals, hours, language — are all importable, so a
 * bulk-loaded course is a first-class citizen rather than an unrecommendable
 * stub. Anything left blank falls back to a safe default and is reported, not
 * silently guessed.
 *
 * By default imported rows land unverified: `linkWorking` stays false, and the
 * engine will not recommend a course whose link nobody has opened. An
 * administrator can override that for a provider's own export by ticking
 * "trusted source" at commit, which is recorded in the audit log. A thousand
 * plausible URLs that nobody has checked is worse than twenty that work.
 */

export const COURSE_IMPORT_COLUMNS = [
  "Code",
  "Title",
  "URL",
  "Provider",
  "Platform",
  "Description",
  "Language",
  "Subtitles",
  "Level",
  "Difficulty",
  "Hours",
  "Free",
  "Price",
  "Certificate",
  "Category",
  "Competencies",
  "Departments",
  "Job Families",
  "Goals",
  "Prerequisites",
  "Technical",
  "Rating",
  "Title AR",
  "Title TR",
  "Description AR",
  "Description TR",
  // Governance, read only when a course is first created: a harvest proposes
  // with Status PENDING_REVIEW, and after that the status is the reviewer's.
  "Status",
  "Content Type",
  "Source",
  "Attribution",
] as const;

const rowSchema = z.object({
  code: z.string().trim().min(2).max(60),
  title: z.string().trim().min(3).max(200),
  url: z.string().trim().url().max(2000).optional().or(z.literal("")),
  provider: z.string().trim().min(1).max(120),
  platform: z.string().trim().max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  language: z.string().trim().optional(),
  subtitles: z.string().trim().optional(),
  level: z.string().trim().optional(),
  difficulty: z.string().trim().optional(),
  hours: z.string().trim().optional(),
  free: z.string().trim().optional(),
  price: z.string().trim().optional(),
  certificate: z.string().trim().optional(),
  category: z.string().trim().optional(),
  competencies: z.string().trim().optional(),
  departments: z.string().trim().optional(),
  jobFamilies: z.string().trim().optional(),
  goals: z.string().trim().optional(),
  prerequisites: z.string().trim().optional(),
  technical: z.string().trim().optional(),
  rating: z.string().trim().optional(),
  titleAr: z.string().trim().max(200).optional(),
  titleTr: z.string().trim().max(200).optional(),
  descriptionAr: z.string().trim().max(4000).optional(),
  descriptionTr: z.string().trim().max(4000).optional(),
  status: z.string().trim().optional(),
  contentType: z.string().trim().optional(),
  source: z.string().trim().max(40).optional(),
  attribution: z.string().trim().max(300).optional(),
});

export const IMPORT_STATUSES = ["PUBLISHED", "PENDING_REVIEW", "DRAFT"] as const;
export const CONTENT_TYPES = [
  "COURSE",
  "PATH",
  "MICRO",
  "PLAYLIST",
  "VIDEO",
  "ARTICLE",
  "BOOK",
  "PDF",
  "EXERCISE",
  "WORKSHOP",
  "WEBINAR",
] as const;

/**
 * The status a new row gets. An empty cell means the file predates the column
 * and is publishing as it always has. Anything else that does not match — a
 * typo, "Pending", "Rejected" — goes to review rather than straight to
 * employees: failing closed is the only safe reading of a value nobody meant.
 */
export function resolveImportStatus(value: string | undefined): (typeof IMPORT_STATUSES)[number] {
  if (!value?.trim()) return "PUBLISHED";
  const hit = matchEnum([value], IMPORT_STATUSES).ok[0];
  return IMPORT_STATUSES.find((s) => s === hit) ?? "PENDING_REVIEW";
}

/** "IBM SkillsBuild", "ibm_skillsbuild" and "IBM-SKILLSBUILD" are the same source. */
export function normaliseSourceKey(value: string | undefined): string | null {
  const key = value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return key || null;
}

/**
 * Content type and source for a row whose file does not say — the same rules
 * the migration used to backfill existing courses, so a course imported today
 * is described the same way as one imported last month.
 */
export function deriveKind(input: { code: string; platform: string; url: string | null; hours: number }) {
  const platform = input.platform.toLowerCase();
  const url = (input.url ?? "").toLowerCase();
  const sourceKey = input.code.toUpperCase().startsWith("MSL-")
    ? "MS_LEARN"
    : url.includes("freecodecamp.org")
      ? "FREECODECAMP"
      : platform.includes("youtube")
        ? "YOUTUBE"
        : platform.includes("btk")
          ? "BTK"
          : null;
  const contentType: (typeof CONTENT_TYPES)[number] = platform.includes("learning path")
    ? "PATH"
    : platform.includes("youtube")
      ? url.includes("playlist?list=")
        ? "PLAYLIST"
        : "VIDEO"
      : input.hours < 1
        ? "MICRO"
        : "COURSE";
  return { sourceKey, contentType };
}

export type CourseRow = z.infer<typeof rowSchema>;

export type CourseImportRowResult = {
  line: number;
  raw: ParsedRow;
  status: "NEW" | "EXISTING" | "DUPLICATE" | "INVALID";
  issues: string[];
  warnings: string[];
  data?: CourseRow;
};

export type CourseImportPreview = {
  headers: string[];
  rows: CourseImportRowResult[];
  counts: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    created: number;
    updated: number;
    unrecommendable: number;
  };
  unknown: { providers: string[]; categories: string[]; departments: string[] };
};

const pick = (row: ParsedRow, ...names: string[]) => {
  for (const n of names) {
    const key = Object.keys(row).find((k) => norm(k) === norm(n));
    if (key && row[key]) return row[key];
  }
  return "";
};

export async function previewCourseImport(file: File): Promise<CourseImportPreview> {
  // Imported here rather than at module scope so validate/commit stay usable
  // outside a request — the spreadsheet parser pulls in server-only ExcelJS.
  const { parseUploadedTable } = await import("../spreadsheet");
  const { headers, rows } = await parseUploadedTable(file);
  return validateCourseRows(headers, rows);
}

/**
 * Validation is separated from parsing so the commit step re-validates the rows
 * the browser sends back — the preview's verdict is never trusted.
 */
export async function validateCourseRows(headers: string[], rows: ParsedRow[]): Promise<CourseImportPreview> {
  const [providers, categories, departments, existing] = await Promise.all([
    prisma.courseProvider.findMany({ select: { key: true, name: true } }),
    prisma.courseCategory.findMany({ select: { key: true, name: true } }),
    prisma.department.findMany({ select: { code: true, name: true } }),
    prisma.course.findMany({ select: { code: true, url: true } }),
  ]);

  const byCode = new Set(existing.map((c) => c.code.toLowerCase()));
  const byUrl = new Map(existing.filter((c) => c.url).map((c) => [c.url!.toLowerCase(), c.code]));
  const seenCodes = new Set<string>();
  const seenUrls = new Set<string>();

  const unknown = {
    providers: new Set<string>(),
    categories: new Set<string>(),
    departments: new Set<string>(),
  };

  const results: CourseImportRowResult[] = rows.map((raw, i) => {
    const candidate = {
      code: pick(raw, "Code", "Course Code", "ID"),
      title: pick(raw, "Title", "Course", "Course Title", "Name"),
      url: pick(raw, "URL", "Link", "Course URL"),
      provider: pick(raw, "Provider", "Partner", "Publisher"),
      platform: pick(raw, "Platform"),
      description: pick(raw, "Description", "Summary"),
      language: pick(raw, "Language"),
      subtitles: pick(raw, "Subtitles", "Subtitle Languages"),
      level: pick(raw, "Level", "AI Level"),
      difficulty: pick(raw, "Difficulty"),
      hours: pick(raw, "Hours", "Duration", "Estimated Hours"),
      free: pick(raw, "Free", "Cost"),
      price: pick(raw, "Price"),
      certificate: pick(raw, "Certificate"),
      category: pick(raw, "Category"),
      competencies: pick(raw, "Competencies", "Skills"),
      departments: pick(raw, "Departments"),
      jobFamilies: pick(raw, "Job Families", "Job Family", "Roles"),
      goals: pick(raw, "Goals", "Learning Goals"),
      prerequisites: pick(raw, "Prerequisites"),
      technical: pick(raw, "Technical"),
      rating: pick(raw, "Rating"),
      titleAr: pick(raw, "Title AR", "TitleAr", "Arabic Title"),
      titleTr: pick(raw, "Title TR", "TitleTr", "Turkish Title"),
      descriptionAr: pick(raw, "Description AR", "DescriptionAr"),
      descriptionTr: pick(raw, "Description TR", "DescriptionTr"),
      status: pick(raw, "Status"),
      contentType: pick(raw, "Content Type", "ContentType", "Type"),
      source: pick(raw, "Source"),
      attribution: pick(raw, "Attribution", "Credit"),
    };

    // A missing code is recoverable: derive a stable one from the title.
    if (!candidate.code && candidate.title) {
      candidate.code = `IMP-${slugify(candidate.title).slice(0, 40).toUpperCase()}`;
    }

    const parsed = rowSchema.safeParse(candidate);
    if (!parsed.success) {
      return {
        line: i + 2,
        raw,
        status: "INVALID",
        issues: parsed.error.issues.map((x) => `${x.path.join(".") || "row"}: ${x.message}`),
        warnings: [],
      };
    }

    const data = parsed.data;
    const issues: string[] = [];
    const warnings: string[] = [];

    const codeKey = data.code.toLowerCase();
    const urlKey = (data.url ?? "").toLowerCase();
    if (seenCodes.has(codeKey) || (urlKey && seenUrls.has(urlKey))) {
      return { line: i + 2, raw, status: "DUPLICATE", issues: ["Repeated in this file"], warnings, data };
    }
    seenCodes.add(codeKey);
    if (urlKey) seenUrls.add(urlKey);

    // Same URL under a different code is almost always an accidental re-add.
    if (urlKey && byUrl.has(urlKey) && byUrl.get(urlKey)!.toLowerCase() !== codeKey) {
      warnings.push(`Same URL already used by course ${byUrl.get(urlKey)}`);
    }
    if (!data.url) warnings.push("No URL — employees will have nothing to open");

    if (!providers.some((p) => norm(p.name) === norm(data.provider) || norm(p.key) === norm(data.provider))) {
      unknown.providers.add(data.provider);
      warnings.push(`New provider "${data.provider}" will be created`);
    }
    if (data.category && !categories.some((c) => norm(c.key) === norm(data.category!) || norm(c.name) === norm(data.category!))) {
      unknown.categories.add(data.category);
      warnings.push(`Unknown category "${data.category}" — left uncategorised`);
    }
    if (data.status?.trim() && !matchEnum([data.status], IMPORT_STATUSES).ok.length) {
      warnings.push(`Unknown status "${data.status}" — sent to the review queue instead of published`);
    }
    if (data.contentType?.trim() && !matchEnum([data.contentType], CONTENT_TYPES).ok.length) {
      warnings.push(`Unknown content type "${data.contentType}" — worked out from the platform instead`);
    }

    const hours = parseHours(data.hours);
    if (!hours) warnings.push("No usable duration — defaults to 2h, which distorts path length");

    const level = matchLevel(data.level);
    if (!level) warnings.push("No AI level — scores a flat 0.6 on level match");

    if (data.language && !LOCALES.some((l) => l === data.language!.toLowerCase())) {
      warnings.push(`Language "${data.language}" is not en/ar/tr — defaults to en`);
    }

    const comp = matchEnum(list(data.competencies), COMPETENCY_KEYS);
    if (comp.bad.length) warnings.push(`Unknown competencies: ${comp.bad.join(", ")}`);
    if (comp.ok.length === 0) warnings.push("No competency mapping — cannot target a skill gap");

    const fam = matchEnum(list(data.jobFamilies), JOB_FAMILIES);
    if (fam.bad.length) warnings.push(`Unknown job families: ${fam.bad.join(", ")}`);

    const goal = matchEnum(list(data.goals), LEARNING_GOALS);
    if (goal.bad.length) warnings.push(`Unknown goals: ${goal.bad.join(", ")}`);

    for (const d of list(data.departments)) {
      if (!departments.some((x) => norm(x.code) === norm(d) || norm(x.name) === norm(d))) {
        unknown.departments.add(d);
        warnings.push(`Unknown department "${d}"`);
      }
    }

    return {
      line: i + 2,
      raw,
      status: byCode.has(codeKey) ? "EXISTING" : "NEW",
      issues,
      warnings,
      data,
    };
  });

  const valid = results.filter((r) => r.status === "NEW" || r.status === "EXISTING");
  return {
    headers,
    rows: results,
    counts: {
      total: results.length,
      valid: valid.length,
      invalid: results.filter((r) => r.status === "INVALID").length,
      duplicates: results.filter((r) => r.status === "DUPLICATE").length,
      created: results.filter((r) => r.status === "NEW").length,
      updated: results.filter((r) => r.status === "EXISTING").length,
      // Rows that will import but that the engine will not recommend yet.
      unrecommendable: valid.filter((r) => !r.data?.url).length,
    },
    unknown: {
      providers: [...unknown.providers],
      categories: [...unknown.categories],
      departments: [...unknown.departments],
    },
  };
}

/**
 * Writes the validated rows. Re-validates first; the browser is not trusted.
 *
 * `trustLinks` is the administrator taking responsibility for the source. Left
 * off, every row lands unverified and the engine will not recommend it until
 * someone opens the link — right for a scraped or hand-assembled list. Turned
 * on, the rows are treated as checked — reasonable for a provider's own catalog
 * export, where the links are as good as any a person would click through. The
 * choice is audited either way.
 */
export async function commitCourseImport(
  preview: CourseImportPreview,
  options: {
    trustLinks?: boolean;
    /**
     * Fill gaps in existing courses and never overwrite anything already set.
     * The catalogue loader re-imports its small files on every boot so that a
     * course picks up reference data that arrived later — a category created
     * after it was imported — and nothing more. Without this an administrator's
     * corrections to such a course (an Arabic title, a category, competencies)
     * were written back to the file's version on every restart. An explicit
     * upload through the admin screen still overwrites: that is what it is for.
     */
    fillOnly?: boolean;
  } = {},
) {
  // Row-by-row on purpose: each course rewrites five relation tables, and an
  // administrator would rather wait than get a half-applied catalog. Measured
  // at roughly a minute per thousand rows on SQLite (scripts/import-smoke.mts).
  // If that becomes a problem, batch the relation writes with createMany inside
  // chunked transactions — but note a Server Action needs a matching timeout.
  const revalidated = await validateCourseRows(
    preview.headers,
    preview.rows.map((r) => r.raw),
  );
  const rows = revalidated.rows.filter((r) => (r.status === "NEW" || r.status === "EXISTING") && r.data);

  const [providers, categories, levels, departments] = await Promise.all([
    prisma.courseProvider.findMany(),
    prisma.courseCategory.findMany(),
    prisma.skillLevel.findMany(),
    prisma.department.findMany(),
  ]);
  const providerByKey = new Map(providers.map((p) => [norm(p.name), p] as const));
  for (const p of providers) providerByKey.set(norm(p.key), p);

  // Seeded with what is already stored, so an import cannot take a slug that
  // belongs to a different course; slugByCode lets a course keep its own.
  const existingSlugs = await prisma.course.findMany({ select: { code: true, slug: true } });
  const usedSlugs = new Set(existingSlugs.map((c) => c.slug));
  const slugByCode = new Map(existingSlugs.map((c) => [c.code, c.slug] as const));

  let created = 0;

  let queued = 0;
  let updated = 0;
  let lessons = 0;

  for (const row of rows) {
    const d = row.data!;

    let provider = providerByKey.get(norm(d.provider));
    if (!provider) {
      const key = slugify(d.provider).toUpperCase().replace(/-/g, "_").slice(0, 40) || "IMPORTED";
      provider = await prisma.courseProvider.upsert({
        where: { key },
        update: { name: d.provider },
        // An unknown provider starts mid-trust: good enough to recommend, not
        // good enough to outrank a curated one on quality alone.
        create: { key, name: d.provider, trustScore: 0.7 },
      });
      providerByKey.set(norm(d.provider), provider);
      providerByKey.set(norm(provider.key), provider);
    }

    const category = d.category
      ? categories.find((c) => norm(c.key) === norm(d.category!) || norm(c.name) === norm(d.category!))
      : undefined;
    const levelCode = matchLevel(d.level);
    const level = levelCode ? levels.find((l) => l.code === levelCode) : undefined;
    const language = LOCALES.find((l) => l === (d.language ?? "").toLowerCase()) ?? "en";
    const isFree = d.free ? truthy(d.free) : !d.price;

    // What the file owns and may rewrite on every import: what the course is.
    const content = {
      slug: uniqueSlug(d.title, d.code, usedSlugs, slugByCode.get(d.code)),
      title: d.title,
      titleAr: d.titleAr || null,
      titleTr: d.titleTr || null,
      description: d.description || d.title,
      descriptionAr: d.descriptionAr || null,
      descriptionTr: d.descriptionTr || null,
      providerId: provider.id,
      platform: d.platform || provider.name,
      url: d.url || null,
      language,
      difficulty: matchDifficulty(d.difficulty) ?? "BEGINNER",
      estimatedHours: parseHours(d.hours) ?? 2,
      isFree,
      price: d.price ? Number(d.price.replace(/[^\d.]/g, "")) || null : null,
      certificateAvailable: truthy(d.certificate),
      aiLevelId: level?.id ?? null,
      categoryId: category?.id ?? null,
      isTechnical: truthy(d.technical),
      rating: d.rating ? Number(d.rating.replace(/[^\d.]/g, "")) || null : null,
      ratingSource: d.rating ? provider.name : null,
      ...(d.attribution ? { attribution: d.attribution } : {}),
    };

    // A course with no URL has nothing to open, so it is never verified
    // whatever the administrator says about the source.
    const linkState = {
      lastVerifiedAt: options.trustLinks && d.url ? new Date() : null,
      linkWorking: Boolean(options.trustLinks && d.url),
      linkFailCount: 0,
      stillAvailable: true,
    };

    // What belongs to the people and jobs running the catalogue, written once,
    // when the course is created. Re-importing used to write all of it again:
    // the catalogue files are re-imported on every boot, so an archived course
    // came back as published, a course the link check had withdrawn came back
    // into the catalogue, a computed quality score fell back to 0.7, and
    // outcomes an administrator had written were cleared — each restart quietly
    // undoing whatever had been decided since.
    const status = resolveImportStatus(d.status);
    const derived = deriveKind({ code: d.code, platform: content.platform, url: content.url, hours: content.estimatedHours });
    const governance = {
      status,
      isInternal: false,
      contentType: matchEnum([d.contentType ?? ""], CONTENT_TYPES).ok[0] ?? derived.contentType,
      sourceKey: normaliseSourceKey(d.source) ?? derived.sourceKey,
      discoveredAt: status === "PENDING_REVIEW" ? new Date() : null,
      qualityScore: 0.7,
      outcomes: "[]",
      outcomesAr: "[]",
      outcomesTr: "[]",
      ...linkState,
    };

    // One transaction per row. The catalogue loader runs this in a child
    // process that can be killed for memory at any statement, and --new-only
    // never revisits a code that already exists — so a kill between the course
    // and its relations used to leave a course with no competencies or
    // language rows, permanently. Now a row lands whole or not at all.
    const { course, isNew } = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.course.findUnique({ where: { code: d.code } });
        // A changed URL is a different thing to check, so its link state
        // starts again; an unchanged one keeps whatever the sweep has found.
        const course = existing
          ? await tx.course.update({
              where: { code: d.code },
              data: {
                ...(options.fillOnly ? fillEmpty(existing, content) : content),
                ...(!options.fillOnly && existing.url !== content.url ? linkState : {}),
              },
            })
          : await tx.course.create({ data: { code: d.code, ...content, ...governance } });

        // A relation is rewritten only when the file says something about it:
        // an empty column is "not in this file", never "clear it". In fill-only
        // mode a course that already has any rows of a kind keeps them.
        const keep = async (count: () => Promise<number>) => Boolean(existing && options.fillOnly && (await count()) > 0);

        const weighted = parseWeighted(d.competencies);
        const comp = matchEnum(weighted.map((w) => w.key), COMPETENCY_KEYS).ok;
        const writeComp = comp.length > 0 && !(await keep(() => tx.courseCompetency.count({ where: { courseId: course.id } })));
        if (writeComp) await tx.courseCompetency.deleteMany({ where: { courseId: course.id } });
        for (const key of writeComp ? comp : []) {
          const competency = await tx.competency.findUnique({ where: { key } });
          if (competency) {
            await tx.courseCompetency.create({
              data: {
                courseId: course.id,
                competencyId: competency.id,
                // The weight the file asked for, not a fixed 3.
                weight: weighted.find((w) => norm(w.key) === norm(key))?.weight ?? 3,
              },
            });
          }
        }

        const depts = list(d.departments);
        const writeDepts = depts.length > 0 && !(await keep(() => tx.courseDepartment.count({ where: { courseId: course.id } })));
        if (writeDepts) await tx.courseDepartment.deleteMany({ where: { courseId: course.id } });
        for (const name of writeDepts ? depts : []) {
          const dept = departments.find((x) => norm(x.code) === norm(name) || norm(x.name) === norm(name));
          if (dept) {
            await tx.courseDepartment.create({ data: { courseId: course.id, departmentId: dept.id, weight: 2 } });
          }
        }

        const families = matchEnum(list(d.jobFamilies), JOB_FAMILIES).ok;
        const writeFamilies =
          families.length > 0 && !(await keep(() => tx.courseJobFamily.count({ where: { courseId: course.id } })));
        if (writeFamilies) await tx.courseJobFamily.deleteMany({ where: { courseId: course.id } });
        for (const jobFamily of writeFamilies ? families : []) {
          await tx.courseJobFamily.create({ data: { courseId: course.id, jobFamily, weight: 2 } });
        }

        const goals = matchEnum(list(d.goals), LEARNING_GOALS).ok;
        const writeGoals = goals.length > 0 && !(await keep(() => tx.courseGoal.count({ where: { courseId: course.id } })));
        if (writeGoals) await tx.courseGoal.deleteMany({ where: { courseId: course.id } });
        for (const goalKey of writeGoals ? goals : []) {
          await tx.courseGoal.create({ data: { courseId: course.id, goalKey, weight: 2 } });
        }

        const keepLanguages = await keep(() => tx.courseLanguage.count({ where: { courseId: course.id } }));
        if (!keepLanguages) {
          await tx.courseLanguage.deleteMany({ where: { courseId: course.id } });
          await tx.courseLanguage.create({ data: { courseId: course.id, language, isSubtitle: false } });
        }
        for (const sub of keepLanguages ? [] : list(d.subtitles)) {
          const code = LOCALES.find((l) => l === sub.toLowerCase());
          if (code && code !== language) {
            await tx.courseLanguage.create({ data: { courseId: course.id, language: code, isSubtitle: true } });
          }
        }
        return { course, isNew: !existing };
      },
      { timeout: 30_000 },
    );
    if (isNew) {
      created++;
      if (status === "PENDING_REVIEW") queued++;
    } else updated++;

    // A YouTube course can play here rather than sending the learner away and
    // asking for a screenshot back. Skips anything that already has modules,
    // so an administrator's own structure is never touched.
    if ((await ensureVideoLesson(course)) === "created") lessons++;
  }

  // Prerequisites in a second pass, so a file may reference its own rows.
  for (const row of rows) {
    const codes = list(row.data!.prerequisites);
    if (!codes.length) continue;
    const course = await prisma.course.findUnique({ where: { code: row.data!.code } });
    if (!course) continue;
    if (options.fillOnly && (await prisma.coursePrerequisite.count({ where: { courseId: course.id } })) > 0) continue;
    await prisma.coursePrerequisite.deleteMany({ where: { courseId: course.id } });
    for (const code of codes) {
      const prereq = await prisma.course.findUnique({ where: { code } });
      if (prereq && prereq.id !== course.id) {
        await prisma.coursePrerequisite.create({ data: { courseId: course.id, prerequisiteId: prereq.id } });
      }
    }
  }

  return {
    created,
    updated,
    /** Of those created, how many went to the review queue rather than live. */
    queued,
    lessons,
    skipped: revalidated.counts.invalid + revalidated.counts.duplicates,
    verified: Boolean(options.trustLinks),
  };
}

/**
 * The fields of `incoming` that `existing` has no value for. A null, an empty
 * string or a missing key is a gap; anything else — including a value an
 * administrator typed — is left exactly as it is.
 */
export function fillEmpty<T extends Record<string, unknown>>(existing: Record<string, unknown>, incoming: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(incoming) as (keyof T & string)[]) {
    const current = existing[key];
    if (current === null || current === undefined || current === "") out[key] = incoming[key];
  }
  return out;
}
