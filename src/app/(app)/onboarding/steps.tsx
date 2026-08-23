"use client";

import { Check } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export function OnboardingSteps({ current }: { current: 1 | 2 | 3 }) {
  const t = useT();
  const steps = [
    { n: 1, title: t("onboarding.step1Title"), body: t("onboarding.step1Body") },
    { n: 2, title: t("onboarding.step2Title"), body: t("onboarding.step2Body") },
    { n: 3, title: t("onboarding.step3Title"), body: t("onboarding.step3Body") },
  ];

  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map((s) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li
            key={s.n}
            aria-current={active ? "step" : undefined}
            className={cn(
              "rounded-[var(--radius-card)] border p-4",
              active
                ? "border-[var(--brand-red)] bg-[var(--brand-red-soft)]"
                : "border-[var(--brand-line)] bg-white",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold",
                done
                  ? "bg-[var(--brand-success)] text-white"
                  : active
                    ? "bg-[var(--brand-red)] text-white"
                    : "bg-[var(--brand-canvas)] text-[var(--brand-muted)]",
              )}
            >
              {done ? <Check size={14} aria-hidden /> : s.n}
              <span className="sr-only">
                {done ? t("common.completed") : active ? t("common.inProgress") : t("common.notStarted")}
              </span>
            </span>
            <p className="mt-2.5 text-sm font-semibold text-[var(--brand-ink)]">{s.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--brand-muted)]">{s.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
