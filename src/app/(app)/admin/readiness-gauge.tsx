"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

type Component = { key: string; label: string; weight: number; value: number; contribution: number };

/**
 * The index is never shown without a way to see how it was calculated —
 * requirement: "Do not produce unexplained numbers."
 */
export function ReadinessGauge({
  score,
  components,
  methodologyLabel,
}: {
  score: number;
  components: Component[];
  methodologyLabel: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <svg width="132" height="132" viewBox="0 0 132 132" className="shrink-0" role="img" aria-label={`AI readiness ${score} out of 100`}>
          <circle cx="66" cy="66" r={radius} fill="none" stroke="var(--brand-line)" strokeWidth="12" />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="var(--brand-red)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 66 66)"
          />
          <text
            x="66"
            y="70"
            textAnchor="middle"
            fontSize="30"
            fontWeight="700"
            fill="var(--brand-ink)"
            fontFamily="inherit"
          >
            {score}
          </text>
          <text x="66" y="88" textAnchor="middle" fontSize="11" fill="var(--brand-muted)" fontFamily="inherit">
            / 100
          </text>
        </svg>

        <div className="w-full min-w-0 sm:flex-1">
          <ul className="space-y-1.5">
            {components.map((c) => (
              <li key={c.key} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate text-[var(--brand-charcoal)]">{c.label}</span>
                <span className="shrink-0 tabular-nums text-[var(--brand-muted)]">
                  {c.value}%<span className="mx-1">·</span>
                  <span className="font-medium text-[var(--brand-ink)]">{c.contribution}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
      >
        {methodologyLabel}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div className="mt-3 overflow-x-auto rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-3">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-[var(--brand-muted)]">
                <th className="pb-1.5 text-start font-medium">{t("form.component")}</th>
                <th className="pb-1.5 text-end font-medium">{t("form.weight")}</th>
                <th className="pb-1.5 text-end font-medium">{t("form.value")}</th>
                <th className="pb-1.5 text-end font-medium">{t("form.points")}</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.key}>
                  <td className="py-1 text-[var(--brand-ink)]">{c.label}</td>
                  <td className="py-1 text-end tabular-nums text-[var(--brand-muted)]">{c.weight}%</td>
                  <td className="py-1 text-end tabular-nums text-[var(--brand-muted)]">{c.value}%</td>
                  <td className="py-1 text-end tabular-nums font-medium text-[var(--brand-ink)]">
                    {c.contribution}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[var(--brand-line)]">
                <td className="pt-1.5 font-semibold text-[var(--brand-ink)]" colSpan={3}>
                  Index
                </td>
                <td className="pt-1.5 text-end font-semibold tabular-nums text-[var(--brand-ink)]">{score}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--brand-muted)]">
            {t("form.readinessMethodHint")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
