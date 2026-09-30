import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Which catalogue courses develop which skills.
 *
 * Matching is by phrase and it is exact and boring on purpose: a development
 * plan tells someone "do this and you will reach level 3", so a wrong match
 * wastes a person's week. Every rule here can be read by whoever has to defend
 * a suggestion.
 *
 * What the phrases are matched against is the **title only**. Matching the
 * description as well looked like better recall and was mostly noise at nine
 * thousand courses: a Microsoft module mentioning "quality control" in passing,
 * or a YouTube channel whose name contains a skill, became the shortest — and
 * so the first — suggestion for a real gap. A title is what a course says it
 * is about.
 *
 * Where a skill has no phrase that is safe at this scale it gets none, and
 * stays unmapped rather than wrong. An unmapped skill shows as a gap with no
 * course, which is honest.
 */

/**
 * `at` is the level a course of this kind can realistically reach. Nothing maps
 * to 5: no online course makes somebody the person who sets the standard.
 *
 * `anyVendor` lets a rule match product courses (Dynamics 365, Azure, Power
 * Platform). Only the tool skills do: an Excel course is an Excel course
 * whoever sells it, but "quality control in Dynamics 365" teaches configuring
 * software, not controlling quality — and T&C's ERP is not Dynamics.
 */
export const SKILL_RULES: { skill: string; at: number; phrases: string[]; anyVendor?: boolean }[] = [
  {
    skill: "EXCEL",
    at: 3,
    anyVendor: true,
    phrases: ["excel", "spreadsheet", "spreadsheets", "pivot table", "pivot tables", "vlookup", "xlookup", "الإكسل", "إكسل", "اكسل"],
  },
  { skill: "POWER_BI", at: 3, anyVendor: true, phrases: ["power bi", "powerbi", "dax", "power query"] },
  {
    skill: "DATA_ANALYSIS",
    at: 3,
    phrases: ["data analysis", "data analytics", "analyzing data", "analysing data", "تحليل البيانات", "veri analizi"],
  },
  {
    skill: "REPORTING",
    at: 3,
    phrases: ["presentation skills", "powerpoint", "business report", "business reports", "data visualization", "data visualisation", "مهارات العرض", "sunum teknikleri"],
  },
  { skill: "ERP_OPERATION", at: 2, phrases: ["erp"] },
  {
    skill: "BUSINESS_ENGLISH",
    at: 3,
    phrases: ["business english", "english for work", "english for business", "الإنجليزية للعمل", "iş ingilizcesi"],
  },
  {
    skill: "OPERATIONAL_TURKISH",
    at: 2,
    phrases: ["learn turkish", "turkish for beginners", "turkish conversation", "اللغة التركية", "التركية"],
  },
  {
    skill: "LEAN_5S",
    at: 3,
    phrases: ["lean manufacturing", "5s", "kaizen", "six sigma", "lean six sigma", "الإنتاج الرشيق", "yalın üretim"],
  },
  { skill: "LINE_BALANCING", at: 3, phrases: ["line balancing", "assembly line balance", "موازنة الخط"] },
  { skill: "SMV", at: 3, phrases: ["standard minute value", "smv", "standard allowed minute"] },
  { skill: "TIME_MOTION", at: 3, phrases: ["time and motion", "time study", "motion study", "work study"] },
  { skill: "CAPACITY_PLANNING", at: 3, phrases: ["capacity planning", "capacity analysis", "تخطيط الطاقة", "kapasite planlama"] },
  {
    skill: "PRODUCTION_SCHEDULING",
    at: 3,
    phrases: ["production planning", "production scheduling", "master production schedule", "جدولة الإنتاج", "üretim planlama"],
  },
  { skill: "CUTTING_ROOM", at: 2, phrases: ["marker making", "fabric cutting", "spreading and cutting"] },
  { skill: "AQL_INSPECTION", at: 3, phrases: ["aql", "acceptable quality limit", "acceptance sampling"] },
  { skill: "INLINE_QC", at: 3, phrases: ["quality control", "in-line inspection", "مراقبة الجودة", "kalite kontrol"] },
  {
    skill: "DEFECT_RCA",
    at: 3,
    phrases: ["root cause analysis", "fishbone", "5 why", "5 whys", "five whys", "تحليل السبب الجذري"],
  },
  { skill: "FABRIC_INSPECTION", at: 2, phrases: ["fabric inspection", "textile testing", "four point system"] },
  { skill: "SPEC_READING", at: 2, phrases: ["tech pack", "garment measurement", "technical drawing"] },
  { skill: "MACHINE_SETUP", at: 2, phrases: ["sewing machine", "machine setup", "smed", "changeover", "ماكينة الخياطة"] },
  {
    skill: "PREVENTIVE_MAINTENANCE",
    at: 3,
    phrases: ["preventive maintenance", "preventative maintenance", "total productive maintenance", "الصيانة الوقائية"],
  },
  { skill: "MECHANICAL_FAULTS", at: 2, phrases: ["mechanical maintenance", "troubleshooting machinery"] },
  { skill: "ELECTRICAL_FAULTS", at: 2, phrases: ["electrical troubleshooting", "electrical maintenance", "plc programming"] },
  {
    skill: "TEAM_LEADERSHIP",
    at: 3,
    phrases: ["team leadership", "leading a team", "leading teams", "first time manager", "supervisor skills", "قيادة الفريق", "ekip liderliği"],
  },
  {
    // Not bare "coaching": at this scale it matches modules about job coaches
    // in supported employment, which are short and so outranked the real ones.
    skill: "ON_JOB_TRAINING",
    at: 3,
    phrases: ["coaching and mentoring", "coaching & mentoring", "coaching skills", "train the trainer", "on the job training", "mentoring", "التدريب والتوجيه"],
  },
  {
    skill: "PERFORMANCE_CONVERSATIONS",
    at: 3,
    phrases: ["difficult conversations", "giving feedback", "performance review", "performance reviews"],
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

/** Product courses, which only the tool skills may match. */
const VENDOR = /dynamics 365|azure|dataverse|power platform|power apps|copilot studio|\b(?:mb|pl|az|dp|ai|sc)-\d{3}\b/i;

/**
 * Case-folding that holds for Turkish. `toLowerCase()` turns a capital dotted
 * İ into "i" plus a combining dot, which then matches no phrase at all — so
 * "İş İngilizcesi" could never find "iş ingilizcesi". The dot is dropped and the
 * dotless ı folded to i, on both sides of the comparison.
 */
export function fold(text: string): string {
  return text.toLowerCase().replace(/̇/g, "").replace(/ı/g, "i");
}

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

/**
 * Whole-phrase matching, never substrings: "erp" in "enterprise" mapped 2,305
 * courses to ERP operation. The boundary is written against letters, digits
 * and the hyphen rather than a word-break escape, so it holds in Arabic and
 * Turkish, and "pre-production" is not "production".
 */
const boundary = (phrase: string) =>
  new RegExp(
    String.raw`(?<![\p{L}\p{N}-])` + fold(phrase.trim()).replace(ESCAPE, "\\$&") + String.raw`(?![\p{L}\p{N}-])`,
    "u",
  );

const MATCHERS = SKILL_RULES.map((r) => ({ ...r, tests: r.phrases.map(boundary) }));

/** The skills a course title matches, and how far each takes someone. */
export function matchSkills(title: string): { skill: string; at: number }[] {
  const haystack = fold(title);
  const vendor = VENDOR.test(title);
  return MATCHERS.filter((r) => (r.anyVendor || !vendor) && r.tests.some((t) => t.test(haystack))).map((r) => ({
    skill: r.skill,
    at: r.at,
  }));
}

/**
 * Rebuilds every course-skill link from the rules.
 *
 * Replaced rather than merged: the rules are the source of truth, so a phrase
 * that is removed takes its links with it. Cheap — titles only — and idempotent,
 * which is why it runs on every boot and again after a catalogue import rather
 * than being a step somebody has to remember.
 */
export async function mapCourseSkills(db: Pick<PrismaClient, "skill" | "course" | "courseSkill" | "$transaction">) {
  const skills = await db.skill.findMany({ select: { id: true, key: true } });
  const byKey = new Map(skills.map((s) => [s.key, s.id]));
  if (byKey.size === 0) return { links: 0, perSkill: new Map<string, number>() };

  const courses = await db.course.findMany({
    where: { status: "PUBLISHED", stillAvailable: true },
    select: { id: true, title: true },
  });

  const pairs: { courseId: string; skillId: string; targetLevel: number }[] = [];
  const perSkill = new Map<string, number>();
  for (const course of courses) {
    for (const m of matchSkills(course.title)) {
      const skillId = byKey.get(m.skill);
      if (!skillId) continue;
      pairs.push({ courseId: course.id, skillId, targetLevel: m.at });
      perSkill.set(m.skill, (perSkill.get(m.skill) ?? 0) + 1);
    }
  }

  // One transaction, so a reader never sees the table empty between the delete
  // and the insert — a manager opening a plan at that moment would see every
  // gap with "no course yet".
  await db.$transaction(
    async (tx) => {
      await tx.courseSkill.deleteMany({});
      for (let i = 0; i < pairs.length; i += 500) {
        await tx.courseSkill.createMany({ data: pairs.slice(i, i + 500) });
      }
    },
    // The default five seconds is tight for a few thousand inserts on a small
    // instance that is also serving requests.
    { timeout: 60_000 },
  );

  return { links: pairs.length, perSkill };
}
