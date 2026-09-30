/**
 * Maps catalogue courses to the skills they develop.
 *
 *   npx tsx scripts/map-course-skills.mts            # report only
 *   npx tsx scripts/map-course-skills.mts --write
 *
 * Matching is by phrase against the title and description, and it is exact and
 * boring on purpose: a development plan tells someone "do this and you will
 * reach level 3", so a wrong match wastes a person's week. Everything here can
 * be read by whoever has to defend a suggestion, and re-running it after a
 * catalogue import is the whole maintenance story.
 *
 * Phrases must be specific enough to survive nine thousand courses. "Excel" is
 * safe; "quality" would match half the catalogue. Where a skill has no phrase
 * that is safe at this scale it gets none, and stays unmapped rather than
 * wrong — an unmapped skill shows as a gap with no course, which is honest.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

/**
 * `at` is the level a course of this kind can realistically reach. Nothing maps
 * to 5: no online course makes somebody the person who sets the standard.
 */
const RULES: { skill: string; at: number; phrases: string[] }[] = [
  { skill: "EXCEL", at: 3, phrases: ["excel", "spreadsheet", "pivot table", "vlookup", "الإكسل", "إكسل"] },
  { skill: "POWER_BI", at: 3, phrases: ["power bi", "powerbi", "dax", "power query"] },
  {
    skill: "DATA_ANALYSIS",
    at: 3,
    phrases: ["data analysis", "data analytics", "analyzing data", "analysing data", "تحليل البيانات", "veri analizi"],
  },
  {
    skill: "REPORTING",
    at: 3,
    phrases: ["presentation skills", "powerpoint", "business report", "data visualization", "data visualisation"],
  },
  // Not "dynamics 365" and not "sap": those match 2,079 and 79 Microsoft
  // courses, most of them about running the product on Azure rather than about
  // working an ERP, and T&C's ERP is neither. A vendor's name is not this skill.
  { skill: "ERP_OPERATION", at: 2, phrases: ["erp"] },
  {
    skill: "BUSINESS_ENGLISH",
    at: 3,
    phrases: ["business english", "english for work", "english for business", "الإنجليزية للعمل", "iş İngilizcesi"],
  },
  {
    skill: "OPERATIONAL_TURKISH",
    at: 2,
    phrases: ["learn turkish", "turkish for beginners", "اللغة التركية", "التركية"],
  },
  {
    skill: "LEAN_5S",
    at: 3,
    phrases: ["lean manufacturing", "5s", "kaizen", "six sigma", "lean six", "الإنتاج الرشيق", "yalın üretim"],
  },
  { skill: "LINE_BALANCING", at: 3, phrases: ["line balancing", "assembly line balance", "موازنة الخط"] },
  { skill: "SMV", at: 3, phrases: ["standard minute value", "smv ", "standard allowed minute"] },
  { skill: "TIME_MOTION", at: 3, phrases: ["time and motion", "time study", "motion study", "work study"] },
  {
    skill: "CAPACITY_PLANNING",
    at: 3,
    phrases: ["capacity planning", "capacity analysis", "تخطيط الطاقة", "kapasite planlama"],
  },
  {
    skill: "PRODUCTION_SCHEDULING",
    at: 3,
    phrases: ["production planning", "production scheduling", "master production schedule", "جدولة الإنتاج"],
  },
  { skill: "CUTTING_ROOM", at: 2, phrases: ["marker making", "fabric cutting", "spreading and cutting"] },
  { skill: "AQL_INSPECTION", at: 3, phrases: ["aql", "acceptable quality limit", "acceptance sampling"] },
  { skill: "INLINE_QC", at: 3, phrases: ["quality control", "in-line inspection", "مراقبة الجودة", "kalite kontrol"] },
  {
    skill: "DEFECT_RCA",
    at: 3,
    phrases: ["root cause analysis", "fishbone", "5 why", "five whys", "تحليل السبب الجذري"],
  },
  { skill: "FABRIC_INSPECTION", at: 2, phrases: ["fabric inspection", "textile testing", "four point system"] },
  { skill: "SPEC_READING", at: 2, phrases: ["tech pack", "garment measurement", "technical drawing"] },
  {
    skill: "MACHINE_SETUP",
    at: 2,
    phrases: ["sewing machine", "machine setup", "smed", "changeover", "ماكينة الخياطة"],
  },
  {
    skill: "PREVENTIVE_MAINTENANCE",
    at: 3,
    phrases: ["preventive maintenance", "preventative maintenance", "tpm", "الصيانة الوقائية"],
  },
  { skill: "MECHANICAL_FAULTS", at: 2, phrases: ["mechanical maintenance", "troubleshooting machinery"] },
  { skill: "ELECTRICAL_FAULTS", at: 2, phrases: ["electrical troubleshooting", "electrical maintenance", "plc "] },
  {
    skill: "TEAM_LEADERSHIP",
    at: 3,
    phrases: ["team leadership", "leading a team", "first time manager", "supervisor skills", "قيادة الفريق", "ekip liderliği"],
  },
  {
    skill: "ON_JOB_TRAINING",
    at: 3,
    phrases: ["coaching", "train the trainer", "on the job training", "mentoring", "التدريب والتوجيه"],
  },
  {
    skill: "PERFORMANCE_CONVERSATIONS",
    at: 3,
    phrases: ["performance management", "difficult conversations", "giving feedback", "performance review"],
  },
  {
    skill: "PROBLEM_SOLVING",
    at: 3,
    phrases: ["problem solving", "critical thinking", "decision making", "حل المشكلات", "problem çözme"],
  },
  {
    skill: "WORKPLACE_SAFETY",
    at: 3,
    phrases: ["workplace safety", "occupational health", "health and safety", "السلامة المهنية", "iş güvenliği"],
  },
  { skill: "SOCIAL_COMPLIANCE", at: 2, phrases: ["social compliance", "labour standards", "labor standards", "bsci"] },
  { skill: "CHEMICAL_AWARENESS", at: 2, phrases: ["reach compliance", "chemical safety", "hazardous substances"] },
];

const write = process.argv.includes("--write");

/**
 * Phrases match on whole words, never as substrings.
 *
 * `includes` looked fine until it was pointed at nine thousand rows: "erp"
 * matched "ent-erp-rise" and mapped 2,305 Microsoft courses to ERP operation.
 * The boundary is written against letters and numbers rather than a word-break
 * escape, so that it holds in Arabic and Turkish too, where that does not.
 */
const ESCAPE = /[.*+?^${}()|[\]\\]/g;

const boundary = (phrase: string) =>
  new RegExp(
    String.raw`(?<![\p{L}\p{N}])` + phrase.trim().replace(ESCAPE, "\\$&") + String.raw`(?![\p{L}\p{N}])`,
    "iu",
  );

const MATCHERS = RULES.map((r) => ({ ...r, tests: r.phrases.map(boundary) }));

const skills = await prisma.skill.findMany({ select: { id: true, key: true } });
const byKey = new Map(skills.map((s) => [s.key, s.id]));

const courses = await prisma.course.findMany({
  where: { status: "PUBLISHED", stillAvailable: true },
  select: { id: true, title: true, description: true },
});
console.log(`${courses.length} published courses, ${RULES.length} rules`);

/** One row per (course, skill). A course teaching Excel *and* Power BI is both. */
const pairs: { courseId: string; skillId: string; targetLevel: number }[] = [];
const perSkill = new Map<string, number>();

for (const course of courses) {
  const haystack = `${course.title} ${course.description ?? ""}`.toLowerCase();
  for (const rule of MATCHERS) {
    const skillId = byKey.get(rule.skill);
    if (!skillId) continue;
    if (!rule.tests.some((t) => t.test(haystack))) continue;
    pairs.push({ courseId: course.id, skillId, targetLevel: rule.at });
    perSkill.set(rule.skill, (perSkill.get(rule.skill) ?? 0) + 1);
  }
}

console.log(`\n${pairs.length} course-skill links across ${perSkill.size} skills:`);
for (const [key, n] of [...perSkill].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${key.padEnd(28)} ${n}`);
}
const unmapped = RULES.filter((r) => !perSkill.has(r.skill)).map((r) => r.skill);
if (unmapped.length) console.log(`\nno course matched: ${unmapped.join(", ")}`);

if (!write) {
  console.log("\n(report only — pass --write to save)");
  process.exit(0);
}

// Replaced rather than merged: the rules are the source of truth, so a phrase
// that is removed has to take its links with it.
await prisma.courseSkill.deleteMany({});
for (let i = 0; i < pairs.length; i += 500) {
  await prisma.courseSkill.createMany({ data: pairs.slice(i, i + 500) });
}
console.log(`\nwrote ${await prisma.courseSkill.count()} links`);
