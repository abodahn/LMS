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
// parseCsv directly rather than parseUploadedTable: the spreadsheet reader
// pulls in ExcelJS and `server-only`, neither of which loads outside a request.
const { headers, rows } = parseCsv(readFileSync(path, "utf8"));
console.log(`${path}: ${headers.length} columns, ${rows.length} rows`);

const preview = await validateCourseRows(headers, rows);
const c = preview.counts;
console.log(
  `${c.total} rows — ${c.created} new, ${c.updated} existing, ${c.invalid} invalid, ` +
    `${c.duplicates} duplicate, ${c.unrecommendable} unrecommendable`,
);
for (const bad of preview.rows.filter((r) => r.status === "INVALID").slice(0, 10)) {
  console.log(`  invalid line ${bad.line}: ${bad.issues.join("; ")}`);
}
if (preview.unknown.providers.length) {
  console.log(`  ${preview.unknown.providers.length} providers will be created`);
}

const result = await commitCourseImport(preview, { trustLinks });
console.log(`imported: ${result.created} created, ${result.updated} updated${trustLinks ? "" : " (links unverified)"}`);
