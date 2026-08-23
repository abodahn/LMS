"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Detail is behind a disclosure on purpose: the headline is the level, and a
 * non-technical learner should never land on a wall of percentages.
 */
export function SkillAnalysis({
  scores,
  overall,
}: {
  scores: { name: string; percentage: number }[];
  overall: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
      >
        {open ? t("assessment.hideDetails") : t("dashboard.viewSkillAnalysis")}
        <ChevronDown size={15} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div className="mt-4 space-y-3">
          {scores.map((s) => (
            <div key={s.name}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-[var(--brand-ink)]">{s.name}</span>
                <span className="text-[13px] tabular-nums text-[var(--brand-muted)]">
                  {Math.round(s.percentage)}%
                </span>
              </div>
              <Progress
                value={s.percentage}
                className="mt-1.5"
                label={`${s.name}: ${Math.round(s.percentage)}%`}
                tone={s.percentage >= 70 ? "success" : s.percentage >= 45 ? "ink" : "brand"}
              />
            </div>
          ))}
          <div className="border-t border-[var(--brand-line)] pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold text-[var(--brand-ink)]">{t("common.total")}</span>
              <span className="text-[13px] font-semibold tabular-nums text-[var(--brand-ink)]">
                {Math.round(overall)}%
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
