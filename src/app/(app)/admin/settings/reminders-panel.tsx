"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { runRemindersAction, toggleReminderAction, type SettingsState } from "./actions";

type Rule = {
  id: string;
  name: string;
  description: string | null;
  channel: string;
  triggerType: string;
  thresholdDays: number;
  enabled: boolean;
};

export function RemindersPanel({ rules }: { rules: Rule[] }) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [state, setState] = useState<SettingsState>({});
  const [pending, start] = useTransition();

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
          <Bell size={17} className="text-[var(--brand-red)]" aria-hidden />
          {t("admin.reminders")}
        </h2>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => start(async () => setState(await runRemindersAction()))}
        >
          {pending ? t("common.saving") : t("form.runNow")}
        </Button>
      </div>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
        {t("form.reminderDedupeHint")}
      </p>

      <ul className="mt-4 space-y-2">
        {rules.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3"
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-[var(--brand-ink)]">{r.name}</span>
              <span className="block text-[12px] text-[var(--brand-muted)]">
                {r.triggerType} · {r.thresholdDays} {t("common.days")} · {r.channel}
                {r.description ? ` · ${r.description}` : ""}
              </span>
            </span>
            <label className="inline-flex shrink-0 items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={r.enabled}
                disabled={pending}
                onChange={(e) =>
                  start(async () => {
                    await toggleReminderAction(r.id, e.target.checked);
                    router.refresh();
                  })
                }
                className="h-4 w-4 accent-[var(--brand-red)]"
              />
              {r.enabled ? t("common.active") : t("common.inactive")}
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}
