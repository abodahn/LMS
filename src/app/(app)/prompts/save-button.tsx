"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { savePromptToToolboxAction } from "./actions";

export function SavePromptButton({
  promptId,
  saved,
  label,
  savedLabel,
}: {
  promptId: string;
  saved: boolean;
  label: string;
  savedLabel: string;
}) {
  const [isSaved, setIsSaved] = useState(saved);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || isSaved}
      onClick={() =>
        start(async () => {
          await savePromptToToolboxAction(promptId);
          setIsSaved(true);
        })
      }
      className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-canvas)] disabled:opacity-70"
    >
      {isSaved ? (
        <BookmarkCheck size={14} className="text-[var(--brand-success)]" aria-hidden />
      ) : (
        <Bookmark size={14} aria-hidden />
      )}
      {isSaved ? savedLabel : label}
    </button>
  );
}
