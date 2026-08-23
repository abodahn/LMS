"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleUseCaseBookmarkAction } from "@/app/(app)/prompts/actions";

export function BookmarkButton({
  useCaseId,
  bookmarked,
  label,
  savedLabel,
}: {
  useCaseId: string;
  bookmarked: boolean;
  label: string;
  savedLabel: string;
}) {
  const [isSaved, setIsSaved] = useState(bookmarked);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={isSaved}
      onClick={() =>
        start(async () => {
          const res = await toggleUseCaseBookmarkAction(useCaseId);
          setIsSaved(res.bookmarked);
        })
      }
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-canvas)]"
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
