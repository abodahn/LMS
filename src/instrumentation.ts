/**
 * In-process scheduler.
 *
 * The documented deployment is a single server, and the app already assumes it
 * (rate limiting is in-memory, uploads are on local disk). Under that
 * assumption a timer inside the app is the whole scheduler, and the operator
 * has nothing to wire up — which is the difference between reminders that fire
 * and reminders that need somebody to remember them.
 *
 * Set SCHEDULER=off and use `npx tsx scripts/run-jobs.mts` from cron instead
 * when running more than one instance, or every replica would do the same work.
 *
 * ponytail: one timer in one process. If this ever runs replicated, move the
 * lock into the database — a `SELECT … FOR UPDATE` on the last-run row is
 * enough — or hand the schedule to cron and turn this off.
 */

const TICK_MS = 15 * 60 * 1000;

export async function register() {
  // Only the Node.js runtime: the edge runtime has no database access, and this
  // hook is invoked for both.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Off by default in development, where a rebuild restarts the timer on every
  // save and nobody wants their dev database sending reminders.
  const setting = process.env.SCHEDULER ?? (process.env.NODE_ENV === "production" ? "on" : "off");
  if (setting !== "on") return;

  const { runDueJobs, databaseReady } = await import("./lib/jobs");

  const tick = async () => {
    try {
      if (!(await databaseReady())) return;
      const outcomes = await runDueJobs();
      for (const o of outcomes.filter((x) => x.ran)) {
        console.info(`[scheduler] ${o.key}: ${o.detail} (${o.ms}ms)`);
      }
    } catch (e) {
      // Never throw out of the timer: an unhandled rejection here would take
      // the server down over a job that can simply run again in fifteen minutes.
      console.error("[scheduler] tick failed:", e instanceof Error ? e.message : e);
    }
  };

  // Let the server finish coming up before the first tick.
  setTimeout(tick, 60_000).unref?.();
  setInterval(tick, TICK_MS).unref?.();
  console.info(`[scheduler] on — checking every ${TICK_MS / 60000} minutes`);
}
