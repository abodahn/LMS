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
 * **Memory is the constraint.** The instance this runs on has 512MB.
 * Validating a whole file builds a preview holding both the raw and the parsed
 * copy of every row, and `commitCourseImport` validates its input again, so a
 * large file at once costs several times its own size. Exceeding that kills the
 * container, which restarts and begins again from nothing — a loop that never
 * completes and takes the site down with it. Hence one file at a time, small
 * batches, and large files held back unless explicitly asked for.
 */

/**
 * Rows a file may hold and still be imported without being asked for. A small
 * file costs seconds and cannot destabilise anything; the eight-thousand-row
 * Microsoft parts can, and wait for LOAD_CATALOGUE=on.
 */
const AUTO_IMPORT_LIMIT = 500;

/** Rows per batch, so peak memory is flat rather than proportional to the file. */
const CHUNK = 400;

/** Codes per lookup — SQLite refuses a very long parameter list. */
const LOOKUP_CHUNK = 300;

let running = false;

/**
 * Every catalogue file in the build, discovered rather than listed. The
 * Microsoft harvest writes itself out in numbered parts and the number changes
 * whenever it is re-run, so a hard-coded list goes stale silently.
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

/** Data rows in a CSV, without parsing it — used only to size the file. */
function countRows(path: string): number {
  const text = readFileSync(path, "utf8");
  let rows = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "\n" && !inQuotes) rows++;
  }
  return Math.max(0, rows - 1 + (text.endsWith("\n") ? 0 : 1));
}

/**
 * How many of these exact codes are already stored.
 *
 * Asked per file, against that file's own codes, rather than counting every
 * imported course at once. The global count was wrong in a way that only
 * appeared once the catalogue was part-loaded: with six thousand Microsoft
 * courses present, a later 98-row language file looked long since imported and
 * was skipped for good. A file is now judged only on its own rows.
 */
async function alreadyStored(codes: string[]): Promise<number> {
  let found = 0;
  for (let i = 0; i < codes.length; i += LOOKUP_CHUNK) {
    found += await prisma.course.count({
      where: { code: { in: codes.slice(i, i + LOOKUP_CHUNK) } },
    });
  }
  return found;
}

export async function ensureCatalogue(): Promise<{ imported: number; skipped: boolean }> {
  if (running) return { imported: 0, skipped: true };
  running = true;

  try {
    const present = catalogueFiles().filter((f) => existsSync(f));
    if (present.length === 0) return { imported: 0, skipped: true };

    const everything = process.env.LOAD_CATALOGUE === "on";
    const sized = present.map((path) => ({ path, rows: countRows(path) }));
    const eligible = everything ? sized : sized.filter((f) => f.rows <= AUTO_IMPORT_LIMIT);
    const deferred = sized.length - eligible.length;

    if (deferred > 0) {
      console.log(`[catalogue] ${deferred} large file(s) held back — set LOAD_CATALOGUE=on to import them`);
    }
    if (eligible.length === 0) return { imported: 0, skipped: true };

    const { parseCsv } = await import("./import/parse");
    const { validateCourseRows, commitCourseImport } = await import("./import/courses");
    let imported = 0;

    for (const { path } of eligible) {
      // Parsed inside the loop so only one file is ever held in memory.
      const { headers, rows } = parseCsv(readFileSync(path, "utf8"));
      const codes = rows.map((r) => r.Code).filter(Boolean);

      // Only a large file is worth skipping. A small one costs a couple of
      // seconds, and re-importing it is how its rows pick up reference data
      // that arrived after they did: the language courses were imported before
      // the Languages category existed, were filed as uncategorised, and could
      // never fix themselves while "already stored" meant "leave alone".
      if (rows.length > AUTO_IMPORT_LIMIT) {
        const stored = await alreadyStored(codes);
        if (stored >= codes.length) {
          console.log(`[catalogue] ${path}: already loaded (${stored} courses)`);
          continue;
        }
      }

      const started = Date.now();
      let created = 0;
      let updated = 0;

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

    if (imported > 0) console.log(`[catalogue] done — ${await prisma.course.count()} courses`);
    return { imported, skipped: imported === 0 };
  } catch (error) {
    // Never fatal. A site serving the courses it has is a working site.
    console.warn(
      `[catalogue] import failed, continuing with what is loaded: ${error instanceof Error ? error.message : error}`,
    );
    return { imported: 0, skipped: true };
  } finally {
    running = false;
  }
}
