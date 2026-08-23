/**
 * Dev utility: report what is still English-only in the database.
 *
 *   npx tsx scripts/check-i18n.mts
 *
 * Untranslated content falls back to English rather than breaking, which is
 * the right behaviour and also the reason it goes unnoticed. This prints it.
 */
import { prisma } from "../prisma/seed/client";

const bar = (done: number, total: number) => {
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);
  const filled = Math.round(pct / 5);
  return `${"█".repeat(filled)}${"░".repeat(20 - filled)} ${String(pct).padStart(3)}%  ${done}/${total}`;
};

type Translatable = {
  textAr: string | null;
  textTr: string | null;
  options: { textAr: string | null; textTr: string | null }[];
};

const fullyTranslated = (q: Translatable) =>
  !!q.textAr && !!q.textTr && q.options.every((o) => o.textAr && o.textTr);

async function main() {
  const courses = await prisma.course.findMany({
    select: { code: true, titleAr: true, titleTr: true, descriptionAr: true, descriptionTr: true, language: true },
  });
  const modules = await prisma.courseModule.findMany({ select: { titleAr: true, titleTr: true } });
  const lessons = await prisma.courseLesson.findMany({
    select: { titleAr: true, titleTr: true, content: true, contentAr: true, contentTr: true },
  });
  const questions = await prisma.assessmentQuestion.findMany({
    select: {
      textAr: true,
      textTr: true,
      competencyId: true,
      difficulty: true,
      bankId: true,
      bank: { select: { key: true } },
      options: { select: { textAr: true, textTr: true } },
    },
  });

  const placement = questions.filter((q) => q.bank?.key === "BANK_PLACEMENT");
  const others = questions.filter((q) => q.bank?.key !== "BANK_PLACEMENT");

  const rows: [string, number, number][] = [
    ["Course titles      ", courses.filter((c) => c.titleAr && c.titleTr).length, courses.length],
    ["Course descriptions", courses.filter((c) => c.descriptionAr && c.descriptionTr).length, courses.length],
    ["Module titles      ", modules.filter((m) => m.titleAr && m.titleTr).length, modules.length],
    ["Lesson titles      ", lessons.filter((l) => l.titleAr && l.titleTr).length, lessons.length],
    ["Lesson bodies      ", lessons.filter((l) => !l.content || (l.contentAr && l.contentTr)).length, lessons.length],
    ["Placement questions", placement.filter(fullyTranslated).length, placement.length],
    ["Other questions    ", others.filter(fullyTranslated).length, others.length],
  ];

  console.log("\nArabic + Turkish coverage\n");
  for (const [label, done, total] of rows) console.log(`  ${label}  ${bar(done, total)}`);

  // Per-assessment coverage is what a learner actually meets. A bank average
  // hides the thing that matters: can this specific paper be sat in Arabic?
  console.log("\nBy assessment — the questions each one can draw\n");
  const definitions = await prisma.assessmentDefinition.findMany({
    where: { status: "PUBLISHED" },
    include: { pools: true },
    orderBy: { title: "asc" },
  });
  for (const def of definitions) {
    const drawable = questions.filter((q) =>
      def.pools.some(
        (p) =>
          p.competencyId === q.competencyId &&
          (!p.difficulty || p.difficulty === q.difficulty) &&
          (!p.bankId || p.bankId === q.bankId),
      ),
    );
    if (drawable.length === 0) continue;
    const label = def.title.length > 34 ? `${def.title.slice(0, 33)}…` : def.title.padEnd(34);
    console.log(`  ${label}  ${bar(drawable.filter(fullyTranslated).length, drawable.length)}`);
  }

  const byLanguage = courses.reduce<Record<string, number>>((acc, c) => {
    acc[c.language] = (acc[c.language] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\nCourses by language of instruction:", byLanguage);

  const missing = courses.filter((c) => !c.titleAr || !c.titleTr).map((c) => c.code);
  if (missing.length) console.log("Courses still English-only in the catalog:", missing.join(", "));
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
