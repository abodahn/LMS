/**
 * Runs the academy's scheduled work.
 *
 *   npx tsx scripts/run-jobs.mts              # run whatever is due
 *   npx tsx scripts/run-jobs.mts --force      # run everything now
 *   npx tsx scripts/run-jobs.mts --only linkSweep
 *   npx tsx scripts/run-jobs.mts --status
 *
 * Point cron (or Windows Task Scheduler) at this hourly; each job checks its own
 * interval, so running it more often than needed costs nothing. The app can also
 * run the same jobs in-process — see instrumentation.ts — which is the default
 * for the single-server deployment.
 */
import "dotenv/config";
import { runDueJobs, jobStatus, type JobKey } from "../src/lib/jobs";
import { prisma } from "../src/lib/db";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? (process.argv[i + 1] ?? "") : undefined;
};

if (process.argv.includes("--status")) {
  for (const s of await jobStatus()) {
    const when = s.lastRun ? s.lastRun.toISOString() : "never";
    console.log(`  ${s.label.padEnd(20)} every ${s.everyHours}h   last run: ${when}`);
  }
  await prisma.$disconnect();
  process.exit(0);
}

const outcomes = await runDueJobs({
  force: process.argv.includes("--force"),
  only: arg("only") as JobKey | undefined,
});

for (const o of outcomes) {
  console.log(`  ${o.ran ? "ran " : "skip"} ${o.key.padEnd(12)} ${o.detail}${o.ms ? ` (${o.ms}ms)` : ""}`);
}

// A failed job should fail the cron entry too, so it shows up in the mail cron
// sends rather than disappearing into a log nobody reads.
if (outcomes.some((o) => o.detail.startsWith("failed:"))) process.exitCode = 1;

await prisma.$disconnect();
