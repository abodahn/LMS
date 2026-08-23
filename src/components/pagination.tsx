"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "./i18n-provider";
import { cn } from "@/lib/utils";

/** Server-side paging: only the current page of rows is ever queried. */
export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const go = (next: number) => {
    const q = new URLSearchParams(params.toString());
    q.set("page", String(next));
    start(() => router.replace(`${pathname}?${q.toString()}`));
  };

  const button = "inline-flex h-9 items-center gap-1 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-medium text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-canvas)] disabled:opacity-40";

  return (
    <nav className="flex items-center justify-between gap-3" aria-label={t("common.page")}>
      <p className="text-[13px] text-[var(--brand-muted)]">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} {t("common.of")} {total}
      </p>
      <div className="flex gap-2">
        <button type="button" className={cn(button)} disabled={page <= 1 || pending} onClick={() => go(page - 1)}>
          <ChevronLeft size={15} className="rtl:rotate-180" aria-hidden />
          {t("common.previous")}
        </button>
        <button type="button" className={cn(button)} disabled={page >= pages || pending} onClick={() => go(page + 1)}>
          {t("common.next")}
          <ChevronRight size={15} className="rtl:rotate-180" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
