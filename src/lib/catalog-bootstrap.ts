import { spawn } from "node:child_process";
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
 * **Memory is the constraint, and it is not the JS heap.** Importing grows
 * resident memory by roughly a quarter of a megabyte per row, and it keeps
 * growing with a heap cap well below the total, because the cost is native: the
 * SQLite driver's own allocations, which releasing a batch does not return.
 * Smaller batches therefore buy nothing — ten thousand rows in one process will
 * exhaust a small instance whatever the batch size. Exiting the process is what
 * returns the memory.
 *
 * So no import runs in the server. Each slice is a child process that does a few
 * hundred rows and exits, and `--new-only` means the next one resumes where it
 * stopped. A slice that dies costs only its own rows: the server is untouched,
 * the site stays up, and the work still converges.
 */

/** Rows a file may hold and still be re-imported whole rather than sliced. */
const AUTO_IMPORT_LIMIT = 500;

/** Rows per child process. Keeps a slice's peak well inside a small instance. */
const SLICE = 300;

/** A slice is a few hundred writes against SQLite, not a request. */
const SLICE_TIMEOUT_MS = 5 * 60 * 1000;

/** Breathing room between slices, so importing never starves a request. */
const BETWEEN_SLICES_MS = 2000;

/** Guard against looping forever on a file that cannot make progress. */
const MAX_SLICES_PER_FILE = 60;

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

/** Failed slices in a row before a file is left for the next boot. */
const MAX_CONSECUTIVE_FAILURES = 3;

type SliceResult = { ok: true; remaining: number } | { ok: false; retryable: boolean };

/**
 * Runs one import slice and reports how many rows it left behind.
 *
 * A slice that could not start at all (no tsx, a spawn error) is not worth
 * retrying — the next attempt would fail the same way. A slice that started and
 * died, most likely killed for memory, is: --new-only picks up where it stopped.
 */
function importSlice(args: string[]): Promise<SliceResult> {
  const cli = "node_modules/tsx/dist/cli.mjs";
  if (!existsSync(cli)) {
    console.warn("[catalogue] tsx not present — cannot import in a child process");
    return Promise.resolve({ ok: false, retryable: false });
  }

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, "scripts/import-courses-csv.mts", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));

    const kill = setTimeout(() => child.kill("SIGTERM"), SLICE_TIMEOUT_MS);

    child.on("error", () => {
      clearTimeout(kill);
      resolve({ ok: false, retryable: false });
    });

    child.on("close", (code) => {
      clearTimeout(kill);
      if (code !== 0) {
        // A slice killed for memory is expected on a small instance and is not
        // an error worth shouting about — the next one resumes. Only the reason
        // is worth keeping.
        console.warn(`[catalogue] slice exited ${code}: ${(err || out).trim().split("\n").pop() ?? ""}`);
        resolve({ ok: false, retryable: true });
        return;
      }
      resolve({ ok: true, remaining: Number(/REMAINING=(\d+)/.exec(out)?.[1] ?? 0) });
    });
  });
}

export async function ensureCatalogue(): Promise<{ imported: number; skipped: boolean }> {
  if (running) return { imported: 0, skipped: true };
  running = true;

  try {
    if (process.env.LOAD_CATALOGUE === "off") {
      console.log("[catalogue] LOAD_CATALOGUE=off — not importing");
      return { imported: 0, skipped: true };
    }

    const present = catalogueFiles().filter((f) => existsSync(f));
    if (present.length === 0) return { imported: 0, skipped: true };

    const before = await prisma.course.count();
    let imported = 0;

    for (const path of present) {
      const rows = countRows(path);

      if (rows <= AUTO_IMPORT_LIMIT) {
        // Small files are re-imported whole, every boot. That is how their rows
        // pick up reference data that arrived after they did: the language
        // courses were imported before the Languages category existed, were
        // filed as uncategorised, and could never fix themselves while "already
        // stored" meant "leave alone".
        const done = await importSlice([path]);
        if (done.ok) console.log(`[catalogue] ${path}: refreshed (${rows} rows)`);
        continue;
      }

      // Large files resume: only rows the catalogue does not already have, a
      // few hundred at a time, until a slice reports nothing left.
      //
      // Progress is measured against the database, not against what the child
      // said it did. Whether a slice helped is the question the whole loop
      // turns on, and answering it by parsing another process's log is a way to
      // stop early over a missed line.
      let slices = 0;
      let failures = 0;
      const fileStart = await prisma.course.count();
      for (;;) {
        const at = await prisma.course.count();
        const done = await importSlice([path, "--new-only", "--limit", String(SLICE)]);
        if (!done.ok) {
          // One slice dying is expected on a small instance; only a run of them
          // means something is actually wrong. Each retry still counts toward
          // MAX_SLICES_PER_FILE below, so this can never spin.
          if (!done.retryable || ++failures >= MAX_CONSECUTIVE_FAILURES) {
            console.log(`[catalogue] ${path}: leaving for the next boot after ${failures} failed slice(s)`);
            break;
          }
          if (++slices >= MAX_SLICES_PER_FILE) break;
          await new Promise((r) => setTimeout(r, BETWEEN_SLICES_MS * 5));
          continue;
        }
        failures = 0;
        if (done.remaining === 0) break;

        if ((await prisma.course.count()) === at) {
          // Rows left, but the catalogue did not grow — every remaining row is
          // invalid or a duplicate, and another slice would do the same again.
          console.log(`[catalogue] ${path}: ${done.remaining} row(s) cannot be imported, moving on`);
          break;
        }
        if (++slices >= MAX_SLICES_PER_FILE) {
          console.log(`[catalogue] ${path}: ${done.remaining} row(s) left for the next boot`);
          break;
        }
        await new Promise((r) => setTimeout(r, BETWEEN_SLICES_MS));
      }
      const fileImported = (await prisma.course.count()) - fileStart;
      imported += fileImported;
      if (fileImported > 0) console.log(`[catalogue] ${path}: +${fileImported} courses`);
    }

    const after = await prisma.course.count();
    if (after !== before) {
      console.log(`[catalogue] done — ${before} → ${after} courses`);
      // New courses are only useful to a development plan once they are mapped
      // to skills; boot mapped the catalogue as it was, before this import.
      const { mapCourseSkills } = await import("./course-skill-map");
      const mapped = await mapCourseSkills(prisma);
      console.log(`[catalogue] ${mapped.links} course-skill links`);
    }
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
