/**
 * Imports a course CSV from the command line.
 *
 *   npx tsx scripts/import-courses-csv.mts data/harvested-courses.csv
 *   npx tsx scripts/import-courses-csv.mts data/courses.csv --untrusted
 *
 * Same validation and audit trail as the admin import screen — this exists so a
 * harvest can be re-applied without scraping again, and so a large file can be
 * imported outside a request timeout.
 *
 * Links are trusted by default here because the file this is pointed at is
 * normally one the harvester just verified. Pass --untrusted for a hand-made or
 * scraped list: those rows land with linkWorking false and stay out of every
 * recommendation until someone opens the link.
 *
 * `--new-only` drops rows already in the catalogue and `--limit N` caps how many
 * of the rest are done in one run, which together make a large file importable
 * on a small instance. The memory an import costs is mostly *native* — the
 * SQLite driver, not the JS heap — so it does not come back when a chunk is
 * released, and a ten-thousand-row file in one process will exhaust anything
 * modest no matter how small the batches are. It comes back when the process
 * exits. So the work is sliced across processes rather than inside one, and
 * `--new-only` is what makes the next slice pick up where the last one stopped.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { validateCourseRows, commitCourseImport } from "../src/lib/import/courses";
import { parseCsv } from "../src/lib/import/parse";

const path = process.argv[2];
if (!path) {
  console.error("usage: npx tsx scripts/import-courses-csv.mts <file.csv> [--untrusted]");
  process.exit(1);
}

const trustLinks = !process.argv.includes("--untrusted");
// Fill gaps in existing courses, overwrite nothing — what the boot loader uses.
const fillOnly = process.argv.includes("--fill-only");
const newOnly = process.argv.includes("--new-only");
const limitAt = process.argv.indexOf("--limit");
const limit = limitAt > -1 ? Number(process.argv[limitAt + 1]) : 0;

// parseCsv directly rather than parseUploadedTable: the spreadsheet reader
// pulls in ExcelJS and `server-only`, neither of which loads outside a request.
const { headers, rows: all } = parseCsv(readFileSync(path, "utf8"));

let rows = all;
if (newOnly) {
  const { prisma } = await import("../src/lib/db");
  const have = new Set<string>();
  const codes = all.map((r) => r.Code).filter(Boolean);
  // SQLite refuses a very long parameter list, so the lookup is chunked too.
  for (let i = 0; i < codes.length; i += 300) {
    const found = await prisma.course.findMany({
      where: { code: { in: codes.slice(i, i + 300) } },
      select: { code: true },
    });
    for (const f of found) have.add(f.code);
  }
  rows = all.filter((r) => !have.has(r.Code));
}
const remaining = rows.length;
if (limit > 0) rows = rows.slice(0, limit);

console.log(`${path}: ${headers.length} columns, ${rows.length} of ${all.length} rows`);
if (rows.length === 0) {
  console.log("REMAINING=0");
  process.exit(0);
}

// Committed in slices even within one run: a single ten-thousand-row preview
// holds the raw and the parsed copy of everything at once.
const CHUNK = 150;
let created = 0;
let updated = 0;
let invalid = 0;

for (let i = 0; i < rows.length; i += CHUNK) {
  const preview = await validateCourseRows(headers, rows.slice(i, i + CHUNK));
  invalid += preview.counts.invalid;
  for (const bad of preview.rows.filter((r) => r.status === "INVALID").slice(0, 3)) {
    console.log(`  invalid line ${bad.line}: ${bad.issues.join("; ")}`);
  }
  const result = await commitCourseImport(preview, { trustLinks, fillOnly });
  created += result.created;
  updated += result.updated;
}

console.log(
  `imported: ${created} created, ${updated} updated, ${invalid} invalid${trustLinks ? "" : " (links unverified)"}`,
);
// Read by the background loader to decide whether another slice is worth
// starting. Counts rows this run did not reach, not rows that failed.
console.log(`REMAINING=${Math.max(0, remaining - rows.length)}`);
