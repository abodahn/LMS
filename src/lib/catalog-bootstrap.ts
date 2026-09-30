import { readFileSync, existsSync } from "node:fs";
import { prisma } from "./db";

/**
 * Loads the shipped catalogue after the server is already answering.
 *
 * This used to run in the container's start command, before the port opened.
 * That was fine at 1,100 courses and is not fine at ten thousand: the platform
 * would sit dark for ten minutes on a first deploy while an import ran, and a
 * host watching for the port would give up and call the deploy failed.
 *
 * So the boot path now does only what must happen before anyone can use the
 * system — migrations, reference data, the first administrator — and the
 * catalogue fills in behind a working site. An instance is usable within
 * seconds with the seeded courses, and complete a few minutes later.
 *
 * Idempotent and self-repairing: it compares what is loaded against what the
 * files hold and imports only when short, so a restart costs one count query.
 */

const FILES = ["data/catalog.csv", "data/catalog-mslearn.csv"];

/** Prefixes owned by the shipped files, so counting does not include seeded courses. */
const PREFIXES = ["YT-", "PF-", "MSL-"];

let running = false;

export async function ensureCatalogue(): Promise<{ imported: number; skipped: boolean }> {
  if (running) return { imported: 0, skipped: true };
  running = true;

  try {
    const present = FILES.filter((f) => existsSync(f));
    if (present.length === 0) return { imported: 0, skipped: true };

    const { parseCsv } = await import("./import/parse");
    const { validateCourseRows, commitCourseImport } = await import("./import/courses");

    const files = present.map((path) => ({ path, ...parseCsv(readFileSync(path, "utf8")) }));
    const expected = files.reduce((sum, f) => sum + f.rows.length, 0);

    const loaded = await prisma.course.count({
      where: { OR: PREFIXES.map((p) => ({ code: { startsWith: p } })) },
    });

    if (loaded >= expected) {
      console.log(`[catalogue] complete — ${loaded} imported courses`);
      return { imported: 0, skipped: true };
    }

    console.log(`[catalogue] ${loaded} of ${expected} loaded — importing in the background`);
    let imported = 0;

    for (const file of files) {
      const started = Date.now();
      const preview = await validateCourseRows(file.headers, file.rows);
      const result = await commitCourseImport(preview, { trustLinks: true });
      imported += result.created;
      console.log(
        `[catalogue] ${file.path}: +${result.created} new, ${result.updated} updated (${Math.round(
          (Date.now() - started) / 1000,
        )}s)`,
      );
    }

    console.log(`[catalogue] done — ${await prisma.course.count()} courses`);
    return { imported, skipped: false };
  } catch (error) {
    // Never fatal. A site serving the seeded catalogue is a working site.
    console.warn(
      `[catalogue] import failed, continuing with what is loaded: ${error instanceof Error ? error.message : error}`,
    );
    return { imported: 0, skipped: true };
  } finally {
    running = false;
  }
}
