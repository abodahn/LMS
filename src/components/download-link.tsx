import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A file download, not a navigation. `next/link` would client-side route and
 * never trigger the browser's download handling, so a plain anchor is correct
 * here — the Next lint rule cannot tell an API route from a page.
 */
export function DownloadLink({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ink";
  className?: string;
}) {
  const styles = {
    primary: "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-dark)]",
    secondary:
      "border border-[var(--brand-line)] text-[var(--brand-ink)] hover:bg-[var(--brand-canvas)]",
    ink: "bg-[var(--brand-ink)] text-white hover:bg-[var(--brand-charcoal)]",
  }[variant];

  return (
    <a
      href={href}
      download
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] px-3 text-[13px] font-semibold transition-colors",
        styles,
        className,
      )}
    >
      {children}
    </a>
  );
}
