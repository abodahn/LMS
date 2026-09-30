import { readFileSync, existsSync, readdirSync } from "node:fs";
import { prisma } from "./db";

/**
 * Loads the shipped catalogue after the server is already answering.
 *
 * This used to run in the container's start command, before the port opened.
 * That was fine at 1,100 courses and is not fine at ten thousand: the platform
 * would sit dark for minutes on a first deploy while an import ran, and a host
 * watching for the port would give up and call the deploy failed.
 *
 * So the boot path does only what must happen before anyone can use the system
 * — migrations, reference data, the first administrator — and the catalogue
 * fills in behind a working site.
 *
 * **Memory is the constraint here, not time.** The instance this runs on has
 * 512MB. Validating a whole file builds a preview holding both the raw and the
 * parsed copy of every row, and `commitCourseImport` validates its input a
 * second time, so a ten-thousand-row file at once costs several times the
 * file's own size. Exceeding that kills the container, which restarts and
 * begins the import again from nothing — a loop that never completes and takes
 * the site down with it. Hence: one file open at a time, and small batches.
 *
 * Idempotent and self-repairing. It compares what is loaded against what the
 * files hold and imports only when short, so an ordinary restart costs one
 * count query, and a restart mid-import resumes from what already landed.
 */

/**
 * Every catalogue file in the build, discovered rather than listed. The
 * Microsoft harvest writes itself out in numbered parts and the number of them
 * changes whenever it is re-run, so a hard-coded list goes stale silently — as
 * it did once, leaving eight thousand courses on disk and unimported.
 */
function catalogueFiles(): string[] {
  try {
    return readdirSync("data")
      .filter((f) => f.startsWith("catalog") && f.endsWith(".csv"))
      .sort()
      .map((f) => `data/${f}`);
  } catch {
    return [];
  }
}

/**
 * Rows per batch. Small enough that peak memory stays a few megabytes, large
 * enough that reloading providers and categories per batch stays amortised.
 */
const CHUNK = 400;

/**
 * Rows a file may hold and still be imported without being asked for.
 *
 * Importing the full Microsoft catalogue unattended took the site down, so that
 * now waits for LOAD_CATALOGUE=on. But blanket-disabling the import meant a
 * later 98-row addition never landed either, which is its own kind of broken: a
 * small file costs seconds and cannot destabilise anything.
 */
const AUTO_IMPORT_LIMIT = 500;

/** Prefixes owned by the shipped files, so counting excludes seeded courses. */
// Every code prefix the shipped files use. A prefix missing here makes those
// rows invisible to the count, so the file looks unimported and is re-imported
// on every single boot — which is exactly what LNG- did.
const PREFIXES = ["YT-", "PF-", "MSL-", "LNG-"];

let running = false;

/** Data rows in a CSV, without parsing it — used only to decide whether to import. */
function countRows(path: string): number {
  const text = readFileSync(path, "utf8");
  let rows = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "\n" && !inQuotes) rows++;
  }
  // Minus the header, and tolerant of a missing trailing newline.
  return Math.max(0, rows - 1 + (text.endsWith("\n") ? 0 : 1));
}

export async function ensureCatalogue(): Promise<{ imported: number; skipped: boolean }> {
  if (running) return { imported: 0, skipped: true };
  running = true;

  try {
    const present = catalogueFiles().filter((f) => existsSync(f));
    if (present.length === 0) return { imported: 0, skipped: true };

    const all = present.map((path) => ({ path, rows: countRows(path) }));
    const everything = process.env.LOAD_CATALOGUE === "on";
    const eligible = everything ? all : all.filter((f) => f.rows <= AUTO_IMPORT_LIMIT);
    const deferred = all.length - eligible.length;

    const expected = eligible.reduce((sum, f) => sum + f.rows, 0);
    const loaded = await prisma.course.count({
      where: { OR: PREFIXES.map((p) => ({ code: { startsWith: p } })) },
    });

    if (deferred > 0) {
      console.log(
        `[catalogue] ${deferred} large file(s) held back — set LOAD_CATALOGUE=on to import them`,
      );
    }

    if (eligible.length === 0) return { imported: 0, skipped: true };

    // Counted across every eligible file, so a small addition alongside files
    // already loaded still registers as short and gets imported.
    if (loaded >= expected) {
      console.log(`[catalogue] nothing new to import — ${loaded} courses from files`);
      return { imported: 0, skipped: true };
    }

    console.log(`[catalogue] importing in the background`);

    const { parseCsv } = await import("./import/parse");
    const { validateCourseRows, commitCourseImport } = await import("./import/courses");
    let imported = 0;

    for (const { path } of eligible) {
      const started = Date.now();
      let created = 0;
      let updated = 0;

      // Parsed inside the loop so only one file is ever held.
      const { headers, rows } = parseCsv(readFileSync(path, "utf8"));

      for (let i = 0; i < rows.length; i += CHUNK) {
        const preview = await validateCourseRows(headers, rows.slice(i, i + CHUNK));
        const result = await commitCourseImport(preview, { trustLinks: true });
        created += result.created;
        updated += result.updated;

        // Yield, so importing never starves a request.
        await new Promise((r) => setTimeout(r, 250));
      }

      imported += created;
      console.log(
        `[catalogue] ${path}: +${created} new, ${updated} updated (${Math.round((Date.now() - started) / 1000)}s)`,
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
