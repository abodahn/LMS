"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useT } from "@/components/i18n-provider";

/** Before/after payloads are already redacted server-side (see lib/audit.ts). */
export function AuditDetail({ before, after }: { before: string | null; after: string | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const pretty = (value: string | null) => {
    if (!value) return "—";
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
      >
        <Eye size={13} aria-hidden />
        {t("common.view")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[var(--brand-ink)]/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative max-h-[80dvh] w-full max-w-3xl overflow-auto rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("common.details")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-control)] px-2 py-1 text-[13px] font-medium text-[var(--brand-muted)] hover:bg-[var(--brand-canvas)]"
              >
                {t("common.close")}
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="section-title">{t("form.before")}</p>
                <pre className="mt-1.5 max-h-96 overflow-auto rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-3 font-mono text-[11.5px] leading-relaxed">
                  {pretty(before)}
                </pre>
              </div>
              <div>
                <p className="section-title">{t("form.after")}</p>
                <pre className="mt-1.5 max-h-96 overflow-auto rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-3 font-mono text-[11.5px] leading-relaxed">
                  {pretty(after)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
