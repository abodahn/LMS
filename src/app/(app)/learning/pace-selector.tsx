"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n-provider";
import { setPaceAction } from "./actions";

const OPTIONS = [1, 2, 3, 5];

export function PaceSelector({ current }: { current: number }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();

  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-[var(--brand-muted)]">{t("dashboard.changePace")}</span>
      <select
        className="rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[var(--brand-ink)]"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = Number(e.target.value);
          setValue(next);
          start(async () => {
            await setPaceAction(next);
            router.refresh();
          });
        }}
      >
        {OPTIONS.map((h) => (
          <option key={h} value={h}>
            {t("dashboard.planPace", { hours: h })}
          </option>
        ))}
      </select>
    </label>
  );
}
