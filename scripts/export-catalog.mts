/**
 * Writes the harvested catalogue to a CSV the importer can read back.
 *
 *   npx tsx scripts/export-catalog.mts
 *
 * The seeds build 55 curated courses in code. The other 1,100 came from
 * harvesting YouTube and verifying platform links, which is a slow, networked
 * process that has no business running on a production boot — so the result is
 * committed as data and replayed on first start instead. That also means a new
 * deployment gets exactly the catalogue that was reviewed, rather than whatever
 * a search returns on the day.
 *
 * Only `YT-` and `PF-` codes are exported. The seeded courses are deliberately
 * excluded: the import path sets `isInternal: false`, so round-tripping T&C's
 * own internal courses through it would quietly strip the flag that decides
 * whether a certificate can be issued.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { prisma } from "../prisma/seed/client";
import { COURSE_IMPORT_COLUMNS } from "../src/lib/import/courses";

const OUT = "data/catalog.csv";

const courses = await prisma.course.findMany({
  where: { OR: [{ code: { startsWith: "YT-" } }, { code: { startsWith: "PF-" } }] },
  include: {
    provider: true,
    category: true,
    aiLevel: true,
    competencies: { include: { competency: true } },
    departments: { include: { department: true } },
    jobFamilies: true,
    goals: true,
    languages: true,
    prerequisites: { include: { prerequisite: { select: { code: true } } } },
  },
  orderBy: { code: "asc" },
});

const rows = courses.map((c) => ({
  Code: c.code,
  Title: c.title,
  URL: c.url ?? "",
  Provider: c.provider.name,
  Platform: c.platform,
  Description: c.description,
  Language: c.language,
  Subtitles: c.languages
    .filter((l) => l.isSubtitle)
    .map((l) => l.language)
    .join(","),
  Level: c.aiLevel?.code ?? "",
  Difficulty: c.difficulty,
  Hours: String(c.estimatedHours),
  Free: c.isFree ? "yes" : "no",
  Price: c.price == null ? "" : String(c.price),
  Certificate: c.certificateAvailable ? "yes" : "no",
  Category: c.category?.key ?? "",
  // The importer reads "KEY:weight" pairs.
  Competencies: c.competencies.map((x) => `${x.competency.key}:${x.weight}`).join(","),
  Departments: c.departments.map((x) => x.department.code).join(","),
  "Job Families": c.jobFamilies.map((x) => x.jobFamily).join(","),
  Goals: c.goals.map((x) => x.goalKey).join(","),
  Prerequisites: c.prerequisites.map((x) => x.prerequisite.code).join(","),
  Technical: c.isTechnical ? "yes" : "no",
  Rating: c.rating == null ? "" : String(c.rating),
  "Title AR": c.titleAr ?? "",
  "Title TR": c.titleTr ?? "",
  "Description AR": c.descriptionAr ?? "",
  "Description TR": c.descriptionTr ?? "",
}));

const csv = [
  COURSE_IMPORT_COLUMNS.join(","),
  ...rows.map((r) =>
    COURSE_IMPORT_COLUMNS.map(
      (col) => `"${String((r as Record<string, string>)[col] ?? "").replace(/"/g, '""')}"`,
    ).join(","),
  ),
].join("\n");

mkdirSync("data", { recursive: true });
// BOM, so Excel opens the Arabic and Turkish titles correctly.
writeFileSync(OUT, "﻿" + csv, "utf8");

const byLanguage = new Map<string, number>();
for (const c of courses) byLanguage.set(c.language, (byLanguage.get(c.language) ?? 0) + 1);

console.log(`wrote ${OUT}: ${rows.length} courses`);
console.log("  " + [...byLanguage].map(([l, n]) => `${l}=${n}`).join("  "));

await prisma.$disconnect();
