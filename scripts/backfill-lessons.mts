/**
 * Gives already-imported YouTube courses a lesson so they play in the academy.
 *
 *   npx tsx scripts/backfill-lessons.mts            # report only
 *   npx tsx scripts/backfill-lessons.mts --apply
 *
 * New imports get this from the importer. This is for the catalogue that was
 * loaded before that existed. Courses that already have modules are left alone,
 * so it is safe to run repeatedly.
 */
import "dotenv/config";
import { prisma } from "../prisma/seed/client";
import { ensureVideoLesson } from "../src/lib/import/lessons";
import { isYouTubeUrl } from "../src/lib/youtube";

const apply = process.argv.includes("--apply");

const courses = await prisma.course.findMany({
  where: { url: { not: null }, modules: { none: {} } },
  select: { id: true, code: true, title: true, url: true, estimatedHours: true },
});

const playable = courses.filter((c) => isYouTubeUrl(c.url));
const offsite = courses.length - playable.length;

console.log(`${courses.length} courses have no modules`);
console.log(`  ${playable.length} are YouTube and can play here`);
console.log(`  ${offsite} live on another platform and stay external`);

if (!apply) {
  for (const c of playable.slice(0, 5)) console.log(`  + ${c.code}  ${c.title.slice(0, 58)}`);
  if (playable.length > 5) console.log(`  … and ${playable.length - 5} more`);
  console.log("\ndry run — pass --apply to write");
  await prisma.$disconnect();
  process.exit(0);
}

let made = 0;
for (const course of playable) {
  if ((await ensureVideoLesson(course)) === "created") made++;
  if (made % 200 === 0 && made) console.log(`  ${made}…`);
}
console.log(`created ${made} lessons`);
await prisma.$disconnect();
