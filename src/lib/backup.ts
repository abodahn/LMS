import path from "node:path";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { prisma } from "./db";
import { BACKUP_DIR } from "./storage-root";

/**
 * Nightly copy of the SQLite database, kept on the same disk as the uploads.
 *
 * `VACUUM INTO` writes a consistent, compacted copy while the site keeps
 * running. These copies protect against what happens inside the application —
 * a bad migration, a mistaken bulk change, a corrupted file. Losing the whole
 * disk is the host's side: Render snapshots persistent disks daily. On
 * PostgreSQL the database host takes the backups and this does nothing.
 *
 * Restore with `npm run db:restore -- <file>` while the service is stopped;
 * rehearse with `npm run db:restore-check`, which opens the newest copy and
 * compares it with the live database.
 */

/** One copy per day for this many days, plus up to TODAY copies from the last day. */
const DAYS = 7;
const TODAY = 10;

/**
 * Which copies to delete. Kept: the newest copy of each of the last DAYS
 * distinct days, and up to TODAY from the newest day — so running a backup by
 * hand ten times after an incident cannot crowd out the copies from before it.
 */
export function expired(names: string[]) {
  const sorted = [...names].sort().reverse();
  const keep = new Set<string>();
  const days: string[] = [];
  for (const n of sorted) {
    const day = n.slice("academy-".length, "academy-".length + 10);
    if (!days.includes(day)) {
      if (days.length === DAYS) continue;
      days.push(day);
      keep.add(n);
    } else if (day === days[0] && [...keep].filter((k) => k.includes(day)).length < TODAY) keep.add(n);
  }
  return sorted.filter((n) => !keep.has(n));
}

export function isSqlite() {
  return (process.env.DATABASE_URL ?? "file:").startsWith("file:");
}

export async function backupDatabase(): Promise<string> {
  if (!isSqlite()) return "skipped: the database host takes the backups";
  await mkdir(BACKUP_DIR, { recursive: true });
  const name = `academy-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  const target = path.join(BACKUP_DIR, name);
  // The path is ours, not user input; quotes are doubled all the same.
  await prisma.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);

  const copies = (await readdir(BACKUP_DIR)).filter((f) => /^academy-.*\.db$/.test(f));
  const old = expired(copies);
  for (const f of old) await unlink(path.join(BACKUP_DIR, f));
  const { size } = await stat(target);
  return `${name} (${(size / 1e6).toFixed(1)} MB), ${copies.length - old.length} kept`;
}
