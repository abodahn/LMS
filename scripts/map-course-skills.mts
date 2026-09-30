/**
 * Reports, and optionally rewrites, the course-to-skill links.
 *
 *   npx tsx scripts/map-course-skills.mts            # report only
 *   npx tsx scripts/map-course-skills.mts --write
 *
 * The rules live in src/lib/course-skill-map.ts, and the same function runs on
 * every boot and after every catalogue import — this is for looking at what
 * they produce, or forcing a rebuild after editing them.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { SKILL_RULES, matchSkills, mapCourseSkills } from "../src/lib/course-skill-map";

const courses = await prisma.course.findMany({
  where: { status: "PUBLISHED", stillAvailable: true },
  select: { title: true },
});

const perSkill = new Map<string, string[]>();
for (const c of courses) {
  for (const m of matchSkills(c.title)) {
    const list = perSkill.get(m.skill) ?? [];
    list.push(c.title);
    perSkill.set(m.skill, list);
  }
}

console.log(`${courses.length} published courses, ${SKILL_RULES.length} rules\n`);
for (const [skill, titles] of [...perSkill].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${skill.padEnd(28)} ${String(titles.length).padStart(4)}   e.g. ${titles[0].slice(0, 70)}`);
}
const unmapped = SKILL_RULES.filter((r) => !perSkill.has(r.skill)).map((r) => r.skill);
if (unmapped.length) console.log(`\nno course matched: ${unmapped.join(", ")}`);

if (process.argv.includes("--write")) {
  const { links } = await mapCourseSkills(prisma);
  console.log(`\nwrote ${links} links`);
} else {
  console.log("\n(report only — pass --write to save)");
}
