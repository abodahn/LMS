/**
 * Developer utility: print what the recommendation engine produced for a set
 * of employees, with the reasons and the rejection list.
 *   npx tsx scripts/inspect-recommendations.mts TC-1004 TC-3002
 */
import { prisma } from "../prisma/seed/client";

const codes =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["TC-1004", "TC-1001", "TC-3002", "TC-0003", "TC-4001", "TC-2002"];

for (const code of codes) {
  const u = await prisma.user.findUniqueOrThrow({
    where: { employeeCode: code },
    include: { jobTitle: true, department: true },
  });
  const run = await prisma.recommendationRun.findFirst({
    where: { userId: u.id },
    orderBy: { generatedAt: "desc" },
    include: { recommendations: { orderBy: { rank: "asc" }, include: { course: true, reasons: true } } },
  });
  const level = await prisma.assessmentAttempt.findFirst({
    where: { userId: u.id, status: "GRADED" },
    orderBy: { submittedAt: "desc" },
    include: { level: true },
  });
  const path = run?.pathId ? await prisma.learningPath.findUnique({ where: { id: run.pathId } }) : null;

  console.log(
    `\n=== ${code} ${u.fullName} — ${u.jobTitle?.name} / ${u.department?.name} — ${level?.level?.code} (${Math.round(level?.percentage ?? 0)}%) ===`,
  );
  console.log(`  programme: ${path?.title ?? "none"} | ${run?.totalHours}h | ${run?.recommendations.length} courses`);
  for (const r of run?.recommendations ?? []) {
    console.log(`   ${String(Math.round(r.score)).padStart(3)}%  [${r.phase}] ${r.course?.title} (${r.course?.estimatedHours}h)`);
    for (const rr of r.reasons.slice(0, 2)) console.log(`          · ${rr.label}`);
  }
  const rejected = JSON.parse(run?.rejected ?? "[]") as { title: string; reason: string }[];
  console.log(`  rejected: ${rejected.slice(0, 5).map((x) => `${x.title} → ${x.reason}`).join(" | ")}`);
}

await prisma.$disconnect();
