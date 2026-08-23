/**
 * Dev utility: prove the course import handles a catalog-sized file.
 *
 *   npx tsx scripts/import-smoke.mts [rows]
 *
 * Generates a synthetic export, runs it through the real validate + commit
 * path, reports timings, then removes everything it created. It writes to the
 * database, so run it against a development database only.
 */
// First: the app's Prisma client reads DATABASE_URL at module scope.
import "dotenv/config";
import { validateCourseRows, commitCourseImport } from "../src/lib/import/courses";
import { prisma } from "../prisma/seed/client";

const ROWS = Number(process.argv[2] ?? 1000);
const PREFIX = "SMOKE-";

const PROVIDERS = ["Coursera", "edX", "Udacity", "Pluralsight", "LinkedIn Learning"];
const CATEGORIES = ["FOUNDATIONS", "GENERATIVE_AI", "PROMPTING", "DATA", "TECHNICAL"];
const COMPETENCIES = ["FUNDAMENTALS", "WORKPLACE", "PROMPTING", "RESPONSIBLE_AI", "DATA_AUTOMATION"];
const DEPARTMENTS = ["FIN", "HR", "PRD", "QLT", "SCM", "COM", "IT"];
const FAMILIES = ["FINANCE", "HR", "PRODUCTION", "QUALITY", "SUPPLY_CHAIN", "SALES_MARKETING", "IT"];
const GOALS = ["WRITING", "EXCEL", "REPORTS", "DATA_ANALYSIS", "AUTOMATION", "RESEARCH"];
const DURATIONS = ["4", "6h", "90 min", "1h 30m", "12 hours", "self-paced"];

const headers = [
  "Code",
  "Title",
  "URL",
  "Provider",
  "Description",
  "Language",
  "Level",
  "Difficulty",
  "Hours",
  "Free",
  "Certificate",
  "Category",
  "Competencies",
  "Departments",
  "Job Families",
  "Goals",
];

function buildRows(n: number) {
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      Code: `${PREFIX}${String(i).padStart(5, "0")}`,
      Title: `Synthetic AI Course ${i}`,
      URL: `https://example.com/courses/${i}`,
      Provider: PROVIDERS[i % PROVIDERS.length],
      Description: `Row ${i} of a synthetic provider export used to size-test the importer.`,
      Language: ["en", "ar", "tr"][i % 3],
      Level: `L${i % 5}`,
      Difficulty: ["Beginner", "Intermediate", "İleri"][i % 3],
      Hours: DURATIONS[i % DURATIONS.length],
      Free: i % 4 === 0 ? "No" : "Yes",
      Certificate: i % 3 === 0 ? "Yes" : "No",
      Category: CATEGORIES[i % CATEGORIES.length],
      Competencies: `${COMPETENCIES[i % COMPETENCIES.length]}, ${COMPETENCIES[(i + 2) % COMPETENCIES.length]}`,
      Departments: DEPARTMENTS[i % DEPARTMENTS.length],
      "Job Families": FAMILIES[i % FAMILIES.length],
      Goals: `${GOALS[i % GOALS.length]}; ${GOALS[(i + 3) % GOALS.length]}`,
    });
  }
  // A few rows that must be caught rather than imported.
  rows.push({ ...rows[0] });                                    // duplicate code
  rows.push({ ...rows[1], Code: `${PREFIX}BADURL`, URL: "not-a-url" });
  rows.push({ ...rows[2], Code: `${PREFIX}NOTITLE`, Title: "" });
  return rows;
}

async function main() {
  console.log(`Generating ${ROWS} rows (+3 deliberately broken)…`);
  const rows = buildRows(ROWS);

  let t = Date.now();
  const preview = await validateCourseRows(headers, rows);
  const validateMs = Date.now() - t;

  console.log(`\nValidate: ${validateMs}ms`);
  console.log("  counts:", preview.counts);
  console.log("  new providers:", preview.unknown.providers.join(", ") || "none");

  t = Date.now();
  const result = await commitCourseImport(preview, { trustLinks: false });
  const commitMs = Date.now() - t;

  console.log(`\nCommit: ${commitMs}ms`);
  console.log("  result:", result);

  const total = await prisma.course.count();
  const recommendable = await prisma.course.count({ where: { status: "PUBLISHED", linkWorking: true } });
  console.log(`\nCatalog now: ${total} courses, ${recommendable} verified and recommendable`);
  console.log(`Unverified imports are excluded from recommendations until reviewed — as designed.`);

  console.log("\nCleaning up…");
  // Filter by relation rather than an id list: a thousand ids in an IN clause
  // exceeds SQLite's bound-parameter limit.
  const mine = { course: { code: { startsWith: PREFIX } } };
  for (const model of [
    prisma.courseCompetency,
    prisma.courseDepartment,
    prisma.courseJobFamily,
    prisma.courseGoal,
    prisma.courseLanguage,
  ]) {
    await (model as { deleteMany: (a: unknown) => Promise<unknown> }).deleteMany({ where: mine });
  }
  await prisma.coursePrerequisite.deleteMany({
    where: { OR: [mine, { prerequisite: { code: { startsWith: PREFIX } } }] },
  });
  const removed = await prisma.course.deleteMany({ where: { code: { startsWith: PREFIX } } });
  await prisma.courseProvider.deleteMany({
    where: { key: { in: ["EDX", "UDACITY", "PLURALSIGHT", "LINKEDIN_LEARNING"] }, courses: { none: {} } },
  });
  console.log(`Removed ${removed.count} synthetic courses. Catalog back to ${await prisma.course.count()}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
