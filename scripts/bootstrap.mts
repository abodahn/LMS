/**
 * First-boot setup, run by the container before the server starts.
 *
 * A fresh deploy gets an empty disk, and an empty database has no roles, no
 * permissions and no competencies — which means nobody can sign in, and there is
 * no screen that explains why. Rather than leave that for an operator to
 * discover, the container seeds the reference data the first time it finds the
 * database bare.
 *
 * Deliberately conditional. Re-seeding on every boot would add a minute to each
 * restart for no gain, and this runs while Render is waiting on the health
 * check.
 *
 * Everything here is idempotent regardless: the seeds upsert, and the
 * administrator is only created when one does not already exist. A restart
 * loop cannot corrupt anything.
 */
import "dotenv/config";
import { prisma } from "../prisma/seed/client";

async function main() {
  // Cheap probe: if roles exist, the database has been through this already.
  const roles = await prisma.role.count().catch(() => -1);

  if (roles === -1) {
    console.error("[bootstrap] cannot reach the database — check DATABASE_URL");
    process.exitCode = 1;
    return;
  }

  if (roles > 0) {
    const users = await prisma.user.count();
    console.log(`[bootstrap] reference data already present (${roles} roles, ${users} users)`);
  } else {
    await seedReferenceData();
  }

  // Always, not only on a fresh database: an instance deployed without these
  // variables has no administrator, and the operator's fix is to add them and
  // redeploy. That has to work.
  await ensureAdministrator();
  console.log("[bootstrap] done");
}

async function seedReferenceData() {
  console.log("[bootstrap] empty database — seeding reference data");

  // Imported lazily so a normal boot never pays to parse the seed modules.
  const { seedCore } = await import("../prisma/seed/core");
  const { seedOrg } = await import("../prisma/seed/org");
  const { seedExternalCourses } = await import("../prisma/seed/courses");
  const { seedNativeLanguageCourses } = await import("../prisma/seed/courses-ar-tr");
  const { seedExtendedCourses } = await import("../prisma/seed/courses-extended");
  const { seedInternalCore } = await import("../prisma/seed/internal-core");
  const { seedRoleCourses } = await import("../prisma/seed/internal-roles");
  const { seedAssessments } = await import("../prisma/seed/assessments");
  const { seedPaths } = await import("../prisma/seed/paths");
  const { seedContent } = await import("../prisma/seed/content");

  const step = async (label: string, fn: () => Promise<unknown>) => {
    const started = Date.now();
    await fn();
    console.log(`[bootstrap]   ${label} (${Date.now() - started}ms)`);
  };

  await step("roles, permissions, competencies, levels", () => seedCore(prisma));
  await step("departments, sections, job titles, locations", () => seedOrg(prisma));
  await step("course catalogue", () => seedExternalCourses(prisma));
  await step("Arabic and Turkish catalogue", () => seedNativeLanguageCourses(prisma));
  await step("extended catalogue", () => seedExtendedCourses(prisma));
  await step("internal courses", () => seedInternalCore(prisma));
  await step("role-specific courses", () => seedRoleCourses(prisma));
  await step("assessments and question banks", () => seedAssessments(prisma));
  await step("learning paths", () => seedPaths(prisma));
  await step("prompt library and use cases", () => seedContent(prisma));
  await importCatalogue();

}

/**
 * Loads the harvested catalogue from the committed CSV.
 *
 * The seeds build 55 curated courses. The other 1,100 were produced by
 * harvesting YouTube and verifying platform links — slow, networked work that
 * has no business running on a production boot, so the reviewed result travels
 * with the repository instead (see scripts/export-catalog.mts).
 *
 * Importing also gives every YouTube course a playable lesson, so the
 * catalogue arrives usable rather than as a list of links.
 *
 * A missing or unreadable file is a warning, not a failure: 55 courses is a
 * working academy, and refusing to start over the other 1,100 would be the
 * wrong trade.
 */
async function importCatalogue() {
  const path = "data/catalog.csv";
  const started = Date.now();

  try {
    const { readFileSync, existsSync } = await import("node:fs");
    if (!existsSync(path)) {
      console.warn(`[bootstrap]   no ${path} — keeping the ${await prisma.course.count()} seeded courses`);
      return;
    }

    const { parseCsv } = await import("../src/lib/import/parse");
    const { validateCourseRows, commitCourseImport } = await import("../src/lib/import/courses");

    const { headers, rows } = parseCsv(readFileSync(path, "utf8"));
    const preview = await validateCourseRows(headers, rows);

    // trustLinks: every URL in this file was verified when it was harvested,
    // which is a stronger check than an administrator ticking a box.
    const result = await commitCourseImport(preview, { trustLinks: true });
    console.log(
      `[bootstrap]   catalogue: ${result.created} courses, ${result.lessons} playable lessons (${Date.now() - started}ms)`,
    );
  } catch (error) {
    console.warn(
      `[bootstrap]   catalogue import failed, continuing with the seeded courses: ${error instanceof Error ? error.message : error}`,
    );
  }
}

/**
 * Creates the first administrator, if one is asked for and does not exist.
 *
 * An instance nobody can sign into is not deployed, it is just running. This
 * runs on every boot and is a no-op once the account is there, so recovering
 * from a deploy that forgot the variables is: add them, redeploy.
 */
async function ensureAdministrator() {
  const code = process.env.ADMIN_CODE;
  const password = process.env.ADMIN_PASSWORD;

  if (code && password) {
    const already = await prisma.user.findUnique({ where: { employeeCode: code } });
    if (already) {
      console.log(`[bootstrap] administrator ${code} already exists — leaving it alone`);
      return;
    }

    const bcrypt = (await import("bcryptjs")).default;
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    const user = await prisma.user.create({
      data: {
        employeeCode: code,
        email: (process.env.ADMIN_EMAIL ?? `${code.toLowerCase()}@example.com`).toLowerCase(),
        username: code.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
        fullName: process.env.ADMIN_NAME ?? "Administrator",
        status: "ACTIVE",
        // Deliberately true: a password that passed through an environment
        // variable has been seen by the platform's logs and dashboard, and
        // should not stay valid.
        mustChangePassword: true,
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await prisma.auditLog.create({
      data: {
        actorName: "bootstrap",
        action: "SUPER_ADMIN_PROVISIONED",
        entity: "User",
        entityId: user.id,
        summary: `First administrator "${code}" created on first boot`,
      },
    });
    console.log(`[bootstrap] administrator ${code} created — it must change its password at first sign-in`);
    return;
  }

  // Say so loudly. Silence here looks identical to a working deploy right up
  // until somebody tries to sign in.
  const admins = await prisma.userRole.count({ where: { role: { key: "SUPER_ADMIN" } } });
  if (admins === 0) {
    console.warn("[bootstrap] ⚠ no administrator exists and ADMIN_CODE / ADMIN_PASSWORD are not set.");
    console.warn("[bootstrap]   Nobody can sign in. Either set both variables and redeploy, or run:");
    console.warn("[bootstrap]   npx tsx scripts/create-admin.mts --code <id> --password <password>");
  }
}

main()
  .catch((error) => {
    console.error("[bootstrap] failed:", error instanceof Error ? error.message : error);
    // Exit non-zero so the container does not start on a half-built database.
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
