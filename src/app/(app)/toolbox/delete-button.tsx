"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteToolboxItemAction } from "./actions";

export function DeleteToolboxItem({
  id,
  kind,
  label,
}: {
  id: string;
  kind: "prompt" | "bookmark" | "note";
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteToolboxItemAction(id, kind))}
      className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-muted)] transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
    >
      <Trash2 size={14} aria-hidden />
      {label}
    </button>
  );
}
