/**
 * Removes harvested courses that a later, stricter harvest no longer returns.
 *
 *   npx tsx scripts/prune-harvested.mts data/harvested-courses.csv
 *   npx tsx scripts/prune-harvested.mts data/harvested-courses.csv --apply
 *
 * A harvest is a snapshot. When the relevance rules tighten, the rows that used
 * to pass are still sitting in the catalogue, and nothing in the import path
 * removes them — an import only ever adds or updates. This deletes the YT- rows
 * that are absent from the given file.
 *
 * Dry by default. Courses that somebody has already enrolled in are always
 * kept and reported: a learner's history is worth more than a tidy catalogue.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../prisma/seed/client";
import { parseCsv } from "../src/lib/import/parse";

const path = process.argv[2];
if (!path) {
  console.error("usage: npx tsx scripts/prune-harvested.mts <file.csv> [--apply]");
  process.exit(1);
}
const apply = process.argv.includes("--apply");

const { rows } = parseCsv(readFileSync(path, "utf8"));
const keep = new Set(rows.map((r) => r.Code).filter(Boolean));
console.log(`${path} lists ${keep.size} harvested courses`);

const harvested = await prisma.course.findMany({
  where: { code: { startsWith: "YT-" } },
  select: { id: true, code: true, title: true, _count: { select: { enrollments: true } } },
});

const stale = harvested.filter((c) => !keep.has(c.code));
const enrolled = stale.filter((c) => c._count.enrollments > 0);
const removable = stale.filter((c) => c._count.enrollments === 0);

console.log(`${harvested.length} harvested courses in the catalogue`);
console.log(`${stale.length} no longer returned — ${removable.length} removable, ${enrolled.length} kept for enrolment history`);
for (const c of removable.slice(0, 5)) console.log(`  - ${c.code}  ${c.title.slice(0, 60)}`);
if (removable.length > 5) console.log(`  … and ${removable.length - 5} more`);

if (!apply) {
  console.log("\ndry run — pass --apply to delete");
  await prisma.$disconnect();
  process.exit(0);
}

// Chunked: SQLite caps the number of bound parameters in one statement.
let deleted = 0;
for (let i = 0; i < removable.length; i += 200) {
  const batch = removable.slice(i, i + 200).map((c) => c.id);
  const result = await prisma.course.deleteMany({ where: { id: { in: batch } } });
  deleted += result.count;
}
console.log(`deleted ${deleted}`);
await prisma.$disconnect();
