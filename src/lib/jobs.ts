import { prisma } from "./db";
import { getSetting, setSetting } from "./settings";
import { runReminderRules } from "./notifications";
import { sweepCourseLinks } from "./links";
import { audit } from "./audit";

/**
 * The scheduled work the academy needs in order to look after itself.
 *
 * Everything here already existed and simply never ran: reminder rules were
 * reachable only from a button in Admin → Settings, and the link fields were
 * only ever written by an administrator opening a course by hand. A learning
 * platform that only nudges people when somebody remembers to click is not
 * doing the job.
 *
 * Last-run times live in SystemSetting rather than a new table — there are two
 * jobs, and a key/value store already exists for exactly this kind of state.
 */

export type JobKey = "reminders" | "linkSweep";

type Job = {
  key: JobKey;
  everyHours: number;
  label: string;
  run: () => Promise<string>;
};

const LAST_RUN = (key: JobKey) => `jobs.${key}.lastRun`;

/**
 * Whether a job is due.
 *
 * Pulled out and exported because the scheduler ticks four times an hour: an
 * off-by-one here is the difference between a daily reminder and four an hour,
 * and that is not something anyone would notice quickly in a log.
 */
export function isDue(lastRun: Date | null, everyHours: number, now = new Date()): boolean {
  if (!lastRun) return true;
  return lastRun.getTime() <= now.getTime() - everyHours * 3600_000;
}

export const JOBS: Job[] = [
  {
    key: "reminders",
    everyHours: 24,
    label: "Reminder rules",
    run: async () => {
      const { sent } = await runReminderRules();
      return `${sent} reminder(s) sent`;
    },
  },
  {
    key: "linkSweep",
    everyHours: 24,
    // 250 a run against a 1,100-course catalogue means everything is seen
    // roughly weekly, without hammering any one provider in a single burst.
    label: "Course link check",
    run: async () => {
      const r = await sweepCourseLinks({ limit: 250 });
      return `${r.checked} checked, ${r.working} ok, ${r.broken} failing, ${r.withdrawn} withdrawn, ${r.recovered} recovered`;
    },
  },
];

export type JobOutcome = { key: JobKey; ran: boolean; detail: string; ms: number };

async function lastRun(key: JobKey): Promise<Date | null> {
  const raw = await getSetting<string>(LAST_RUN(key), "");
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export async function jobStatus() {
  return Promise.all(
    JOBS.map(async (job) => ({
      key: job.key,
      label: job.label,
      everyHours: job.everyHours,
      lastRun: await lastRun(job.key),
    })),
  );
}

/**
 * Runs whichever jobs are due.
 *
 * Safe to call as often as you like: each job checks its own interval, so a
 * five-minute tick and a nightly cron produce the same amount of work. Called
 * with `force` it runs everything, which is what the admin button does.
 *
 * A job that throws is recorded and does not stop the others. Its last-run time
 * is left alone so the next tick retries it.
 */
export async function runDueJobs(options: { force?: boolean; only?: JobKey } = {}): Promise<JobOutcome[]> {
  const outcomes: JobOutcome[] = [];

  for (const job of JOBS) {
    if (options.only && job.key !== options.only) continue;

    const previous = await lastRun(job.key);
    const due = options.force || isDue(previous, job.everyHours);

    if (!due) {
      outcomes.push({ key: job.key, ran: false, detail: "not due", ms: 0 });
      continue;
    }

    const started = Date.now();
    try {
      const detail = await job.run();
      await setSetting(LAST_RUN(job.key), new Date().toISOString());
      outcomes.push({ key: job.key, ran: true, detail, ms: Date.now() - started });
      await audit({
        actorName: "scheduler",
        action: "JOB_RUN",
        entity: "Job",
        entityId: job.key,
        summary: `${job.label}: ${detail}`.slice(0, 500),
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      outcomes.push({ key: job.key, ran: false, detail: `failed: ${detail}`, ms: Date.now() - started });
      // Deliberately not stamping lastRun: the next tick should retry.
      await audit({
        actorName: "scheduler",
        action: "JOB_FAILED",
        entity: "Job",
        entityId: job.key,
        summary: `${job.label} failed: ${detail}`.slice(0, 500),
      }).catch(() => {});
    }
  }

  return outcomes;
}

/** True when the database is reachable — used by the in-process scheduler. */
export async function databaseReady(): Promise<boolean> {
  try {
    await prisma.systemSetting.count();
    return true;
  } catch {
    return false;
  }
}
