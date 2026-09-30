import { prisma } from "./client";
import { seedCore } from "./core";
import { seedOrg } from "./org";
import { seedExternalCourses } from "./courses";
import { seedNativeLanguageCourses } from "./courses-ar-tr";
import { seedExtendedCourses } from "./courses-extended";
import { seedInternalCore } from "./internal-core";
import { seedRoleCourses } from "./internal-roles";
import { seedAssessments } from "./assessments";
import { seedPaths } from "./paths";
import { seedContent } from "./content";
import { seedDemo } from "./demo";
import { seedSessions } from "./sessions";
import { seedSkills } from "./skills";
import { mapCourseSkills } from "../../src/lib/course-skill-map";

const includeDemo = process.env.SEED_DEMO !== "false";

async function main() {
  const step = async (label: string, fn: () => Promise<unknown>) => {
    const started = Date.now();
    await fn();
    console.log(`  ✓ ${label} (${Date.now() - started}ms)`);
  };

  console.log("Seeding T&C AI Academy…");
  await step("roles, permissions, competencies, levels, settings", () => seedCore(prisma));
  await step("departments, sections, job titles, locations", () => seedOrg(prisma));
  await step("external course catalog", () => seedExternalCourses(prisma));
  await step("Arabic and Turkish course catalog", () => seedNativeLanguageCourses(prisma));
  await step("extended catalog (Kaggle, short courses, Microsoft)", () => seedExtendedCourses(prisma));
  await step("internal courses (AI at T&C, Responsible AI)", () => seedInternalCore(prisma));
  await step("role-specific courses", () => seedRoleCourses(prisma));
  await step("assessments and question banks", () => seedAssessments(prisma));
  await step("learning paths", () => seedPaths(prisma));
  await step("prompt library, use cases, capstones", () => seedContent(prisma));
  // After the org and the catalogue: requirements need job titles, and the
  // course-skill links need both skills and courses to exist.
  await step("skills and job requirements", () => seedSkills(prisma));
  await step("course-skill links", () => mapCourseSkills(prisma));

  if (includeDemo) {
    let result: { users: number; password: string } | undefined;
    await step("demo employees and history", async () => {
      result = await seedDemo(prisma);
    });
    // Sessions need the demo employees to register against them, so this is
    // part of the demo dataset rather than the reference data.
    await step("instructor-led training sessions", () => seedSessions(prisma));

    console.log(`\nDemo accounts created: ${result?.users}. Password for all: ${result?.password}`);
    console.log("  Super Admin  TC-0001  ahmed.elgohary@tcgarments.com");
    console.log("  L&D Admin    TC-0002  yasmin.farouk@tcgarments.com");
    console.log("  Manager      TC-1001  hala.mansour@tcgarments.com");
    console.log("  Employee     TC-1004  omar.zaki@tcgarments.com");
    console.log("\nSet SEED_DEMO=false to seed a production instance without them.");
  } else {
    console.log("\nSEED_DEMO=false — no demo accounts created.");
  }

  const counts = {
    courses: await prisma.course.count(),
    questions: await prisma.assessmentQuestion.count(),
    prompts: await prisma.promptTemplate.count(),
    useCases: await prisma.aiUseCase.count(),
    users: await prisma.user.count(),
  };
  console.log("\nCatalog:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
