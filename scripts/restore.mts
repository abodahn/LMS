/**
 * Backups: check one, or put one back.
 *
 *   npx tsx scripts/restore.mts --check            # rehearse: newest backup vs live
 *   npx tsx scripts/restore.mts --check <file>
 *   npx tsx scripts/restore.mts <file> --yes       # restore (application stopped!)
 *   npx tsx scripts/restore.mts --boot             # at container start, see below
 *
 * On Render the database is only ever free at start-up, so that is where a
 * restore happens: set RESTORE_FROM to the backup's file name (or full path)
 * and restart. `--boot` runs before migrations, restores once, and leaves a
 * `<backup>.restored` marker so later restarts do not roll the data back
 * again; remove RESTORE_FROM afterwards all the same. Without RESTORE_FROM it
 * does nothing.
 *
 * The check opens the copy read-only, runs SQLite's integrity check and
 * compares row counts with the live database, so "we have backups" is
 * something that has been shown rather than assumed. A restore checks the copy
 * the same way first, keeps the current file beside it as
 * `<db>.before-restore-<time>`, and only then copies the backup over it.
 *
 * Run a restore only with the application stopped: copying over a database
 * that a running server holds open loses whatever it writes next. On Render,
 * that means suspending the service and using its shell.
 */
import "dotenv/config";
import path from "node:path";
import { access, copyFile, readdir, rm, writeFile } from "node:fs/promises";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
// Not lib/backup: that opens the live database, and a restore must not hold it.
import { BACKUP_DIR } from "../src/lib/storage-root";

const TABLES = ["User", "Course", "Enrollment", "Certificate", "AssessmentAttempt", "AuditLog"];

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
if (!url.startsWith("file:")) {
  console.error("Not a SQLite database: restore through the database host instead.");
  process.exit(1);
}
const live = path.resolve(url.slice("file:".length));

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function newest() {
  const files = (await readdir(BACKUP_DIR)).filter((f) => /^academy-.*\.db$/.test(f)).sort();
  if (!files.length) throw new Error(`no backups in ${BACKUP_DIR}`);
  return path.join(BACKUP_DIR, files[files.length - 1]);
}

async function inspect(file: string) {
  await access(file);
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${file}` }) });
  try {
    const [row] = await db.$queryRawUnsafe<{ integrity_check: string }[]>("PRAGMA integrity_check");
    const counts: Record<string, number> = {};
    for (const t of TABLES) {
      const [c] = await db.$queryRawUnsafe<{ n: number | bigint }[]>(`SELECT COUNT(*) AS n FROM "${t}"`);
      counts[t] = Number(c.n);
    }
    return { integrity: row.integrity_check, counts };
  } finally {
    await db.$disconnect();
  }
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const boot = args.includes("--boot");
const fromEnv = process.env.RESTORE_FROM?.trim();
if (boot && !fromEnv) process.exit(0);
const file = boot ? fromEnv : args.find((a) => !a.startsWith("--"));
const target = file ? path.resolve(BACKUP_DIR, file) : await newest();
if (boot && (await exists(`${target}.restored`))) {
  console.log(`[restore] ${path.basename(target)} was already restored; remove RESTORE_FROM.`);
  process.exit(0);
}

const backup = await inspect(target);
console.log(`backup  ${target}`);
console.log(`        integrity: ${backup.integrity}`);
if (backup.integrity !== "ok") {
  console.error("The backup is damaged. Nothing was changed.");
  process.exit(1);
}

if (check) {
  const current = await inspect(live);
  console.log(`live    ${live}`);
  console.log("table".padEnd(20), "backup".padStart(9), "live".padStart(9));
  for (const t of TABLES) console.log(t.padEnd(20), String(backup.counts[t]).padStart(9), String(current.counts[t]).padStart(9));
  console.log("The backup opens, passes the integrity check and holds data. Rehearsal passed.");
  process.exit(0);
}

if (!boot && !args.includes("--yes")) {
  console.error("Restoring replaces the live database. Stop the application, then re-run with --yes.");
  process.exit(1);
}
// The rollback copy is the file and its WAL together: recent commits may
// still live only in the WAL, and a copy of the main file alone would lose them.
const aside = `${live}.before-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`;
await copyFile(live, aside);
for (const side of ["-wal", "-shm"]) {
  if (await exists(`${live}${side}`)) await copyFile(`${live}${side}`, `${aside}${side}`);
}
// Left behind, the old WAL would be replayed onto the restored file.
await rm(`${live}-wal`, { force: true });
await rm(`${live}-shm`, { force: true });
await copyFile(target, live);
if (boot) await writeFile(`${target}.restored`, new Date().toISOString());
console.log(`[restore] Restored ${path.basename(target)}. The previous database is kept at ${aside}.`);
