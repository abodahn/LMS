/**
 * Re-applies the current relevance rules to an existing harvest file.
 *
 *   npx tsx scripts/filter-harvested.mts data/harvested-courses.csv
 *
 * A harvest takes several minutes of paced requests, so when the rules in
 * src/lib/import/relevance.ts tighten it is not worth scraping again — the
 * titles are already in the file and that is all the filters look at.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseCsv } from "../src/lib/import/parse";
import { writtenIn, type HarvestLang } from "../src/lib/import/relevance";
import { COURSE_IMPORT_COLUMNS } from "../src/lib/import/courses";

const path = process.argv[2];
if (!path) {
  console.error("usage: npx tsx scripts/filter-harvested.mts <file.csv>");
  process.exit(1);
}

const { rows } = parseCsv(readFileSync(path, "utf8"));
const kept = rows.filter((r) => writtenIn(r.Title ?? "", (r.Language ?? "en") as HarvestLang));
const dropped = rows.filter((r) => !kept.includes(r));

console.log(`${rows.length} rows → ${kept.length} kept, ${dropped.length} dropped`);
for (const lang of ["en", "ar", "tr"]) {
  const before = rows.filter((r) => r.Language === lang).length;
  const after = kept.filter((r) => r.Language === lang).length;
  console.log(`  ${lang}: ${before} → ${after}`);
}
for (const r of dropped.slice(0, 6)) {
  console.log(`  dropped [${r.Language}] ${(r.Title ?? "").slice(0, 62)}`);
}

const csv = [
  COURSE_IMPORT_COLUMNS.join(","),
  ...kept.map((r) =>
    COURSE_IMPORT_COLUMNS.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","),
  ),
].join("\n");
writeFileSync(path, "﻿" + csv, "utf8");
console.log(`\nrewrote ${path}`);
