/**
 * Dev utility: show what the recommendation engine produces for the same
 * employee in each of the three working languages.
 *
 *   npx tsx scripts/inspect-language.mts TC-4004
 */
import { prisma } from "../prisma/seed/client";
import { generateRecommendations } from "../src/lib/recommendation/service";

const code = process.argv[2] ?? "TC-4004";

async function main() {
  const user = await prisma.user.findUnique({ where: { employeeCode: code } });
  if (!user) throw new Error(`No employee ${code}`);
  const original = user.preferredLanguage;

  for (const language of ["en", "ar", "tr"] as const) {
    await prisma.user.update({ where: { id: user.id }, data: { preferredLanguage: language } });
    const { runId, result } = await generateRecommendations(user.id);
    const recs = await prisma.recommendation.findMany({
      where: { runId },
      include: { course: true },
      orderBy: { rank: "asc" },
    });
    console.log(`\n=== ${user.fullName} · ${code} · prefers ${language.toUpperCase()} ===`);
    console.log(`${result.programTitle ?? "(no programme)"} — ${result.totalHours}h, ${recs.length} courses`);
    for (const r of recs) {
      if (!r.course) continue;
      console.log(
        `  [${r.course.language}] ${r.course.code.padEnd(22)} ${r.course.estimatedHours}h  score ${r.score}  ${r.course.title}`,
      );
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { preferredLanguage: original } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
