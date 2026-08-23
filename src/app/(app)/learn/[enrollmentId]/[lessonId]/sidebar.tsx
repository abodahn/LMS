"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, CircleCheck, Circle, PlayCircle } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type Module = {
  id: string;
  title: string;
  lessons: { id: string; title: string; minutes: number; type: string }[];
};

export function LessonSidebar({
  enrollmentId,
  currentLessonId,
  completedLessonIds,
  modules,
}: {
  enrollmentId: string;
  currentLessonId: string;
  completedLessonIds: string[];
  modules: Module[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const done = new Set(completedLessonIds);

  const body = (
    <nav aria-label={t("learning.modules")} className="space-y-4">
      {modules.map((m) => (
        <div key={m.id}>
          <p className="section-title px-1">{m.title}</p>
          <ul className="mt-1.5 space-y-0.5">
            {m.lessons.map((l) => {
              const active = l.id === currentLessonId;
              const complete = done.has(l.id);
              return (
                <li key={l.id}>
                  <Link
                    href={`/learn/${enrollmentId}/${l.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-start gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-[var(--brand-red-soft)] font-semibold text-[var(--brand-red-dark)]"
                        : "text-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]",
                    )}
                  >
                    {complete ? (
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-[var(--brand-success)]" aria-hidden />
                    ) : active ? (
                      <PlayCircle size={15} className="mt-0.5 shrink-0 text-[var(--brand-red)]" aria-hidden />
                    ) : (
                      <Circle size={15} className="mt-0.5 shrink-0 text-[var(--brand-line)]" aria-hidden />
                    )}
                    <span className="min-w-0">
                      <span className="block leading-snug">{l.title}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-[var(--brand-muted)]">
                        {l.minutes} {t("common.minutesShort")}
                        {complete ? ` · ${t("common.completed")}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile: collapsed by default so the lesson gets the screen. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--brand-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-ink)]"
        >
          {t("learning.modules")}
          <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {open ? <div className="card mt-2 p-3">{body}</div> : null}
      </div>

      <aside className="hidden lg:block">
        <div className="card sticky top-6 max-h-[calc(100dvh-6rem)] overflow-y-auto p-4">{body}</div>
      </aside>
    </>
  );
}
