"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "./i18n-provider";
import { cn } from "@/lib/utils";

export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Clipboard can be blocked; select-and-copy still works from the page.
          return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-canvas)]",
        className,
      )}
      aria-live="polite"
    >
      {copied ? <Check size={14} className="text-[var(--brand-success)]" aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? t("toolbox.copied") : (label ?? t("toolbox.copy"))}
    </button>
  );
}
