"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALES } from "@/lib/constants";
import { LOCALE_LABELS } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";
import { setLocaleAction } from "@/app/(auth)/actions";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-[var(--brand-muted)]">
      <Globe size={15} aria-hidden />
      <span className="sr-only">{t("common.language")}</span>
      <select
        className="rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-white px-2 py-1.5 text-[13px] font-medium text-[var(--brand-ink)]"
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          start(async () => {
            await setLocaleAction(next);
            router.refresh();
          });
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {compact ? l.toUpperCase() : LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
