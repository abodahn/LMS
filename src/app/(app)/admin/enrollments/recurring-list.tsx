"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { FormError } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { toggleRecurringAction, type EnrollmentState } from "./actions";

export type RecurringRow = {
  id: string;
  course: string;
  audience: string;
  audienceValue: string | null;
  everyMonths: number;
  isActive: boolean;
  lastRunAt: string | null;
};

/**
 * The rules currently in force.
 *
 * A paused rule stays in the list rather than being deleted: "we stopped doing
 * annual fire safety in March" is a thing an auditor asks about, and a row that
 * was removed cannot answer it.
 */
export function RecurringList({ rules }: { rules: RecurringRow[] }) {
  const t = useT();
  const msg = useMessage();
  const [state, toggle] = useActionState<EnrollmentState, FormData>(toggleRecurringAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.recurringActive")}</h2>
      <FormError>{msg(state.error)}</FormError>

      <ul className="mt-3">
        {rules.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brand-line)] py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--brand-ink)]">{r.course}</p>
              <p className="text-[12px] text-[var(--brand-muted)]">
                {r.audienceValue ?? t("form.audienceEveryone")}
                {" · "}
                {t("form.everyMonthsShort", { months: r.everyMonths })}
                {r.lastRunAt ? ` · ${t("form.lastRun")} ${r.lastRunAt}` : ` · ${t("form.neverRun")}`}
              </p>
            </div>
            <form action={toggle} className="flex items-center gap-2">
              <input type="hidden" name="id" value={r.id} />
              <span
                className="rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide"
                style={{
                  background: r.isActive ? "var(--brand-red-soft)" : "var(--brand-canvas)",
                  color: r.isActive ? "var(--brand-red)" : "var(--brand-muted)",
                }}
              >
                {r.isActive ? t("form.ruleActive") : t("common.paused")}
              </span>
              <Button type="submit" size="sm" variant="secondary">
                {r.isActive ? t("common.pause") : t("common.resume")}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </Card>
  );
}
