"use client";

import { useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { FormSuccess } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { formatDateTime } from "@/lib/utils";
import type { Locale } from "@/lib/constants";
import { runJobsAction } from "./actions";

type JobRow = { key: string; label: string; everyHours: number; lastRun: string | null };

// Explicit rather than built from the key: translate() splits on dots, so a
// key like "form.job.reminders" would be looked up as a nested object.
const JOB_LABEL: Record<string, string> = {
  reminders: "form.jobReminders",
  linkSweep: "form.jobLinkSweep",
};

/**
 * Shows that the scheduler is alive.
 *
 * Reminders and the link check run on a timer inside the app, which means the
 * only way an administrator can tell the difference between "nothing was due"
 * and "the scheduler has been dead for a month" is to see the last run time.
 */
export function JobsPanel({ jobs, locale, schedulerOn }: { jobs: JobRow[]; locale: Locale; schedulerOn: boolean }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
          <Clock size={17} className="text-[var(--brand-red)]" aria-hidden />
          {t("form.scheduledJobs")}
        </h2>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => start(async () => setMessage(await runJobsAction()))}
        >
          {pending ? t("common.saving") : t("form.runNow")}
        </Button>
      </div>

      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
        {schedulerOn ? t("form.schedulerOn") : t("form.schedulerOff")}
      </p>
      {message ? <FormSuccess>{message}</FormSuccess> : null}

      <ul className="mt-4 space-y-2">
        {jobs.map((job) => (
          <li
            key={job.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3"
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-[var(--brand-ink)]">
                {JOB_LABEL[job.key] ? t(JOB_LABEL[job.key]) : job.label}
              </span>
              <span className="block text-[12px] text-[var(--brand-muted)]">
                {t("form.everyHours", { hours: String(job.everyHours) })}
              </span>
            </span>
            <span className="shrink-0 text-[13px] tabular-nums text-[var(--brand-muted)]">
              {job.lastRun ? formatDateTime(new Date(job.lastRun), locale) : t("form.neverRun")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
