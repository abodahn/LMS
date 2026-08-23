import { LEVEL_COLORS } from "@/lib/branding";
import { cn } from "@/lib/utils";

/**
 * Level is always shown as code + name, never colour alone — colour is a
 * secondary cue only (accessibility requirement).
 */
export function LevelChip({
  code,
  name,
  size = "md",
  className,
}: {
  code: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const color = LEVEL_COLORS[code] ?? "#6B7280";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold tracking-tight text-white",
          size === "lg" ? "h-10 w-10 text-base" : size === "md" ? "h-7 w-7 text-[12px]" : "h-6 w-6 text-[11px]",
        )}
        style={{ background: color }}
        aria-hidden
      >
        {code}
      </span>
      {name ? (
        <span
          className={cn(
            "font-semibold text-[var(--brand-ink)]",
            size === "lg" ? "text-[17px] tracking-[-0.01em]" : size === "md" ? "text-sm" : "text-[13px]",
          )}
        >
          <span className="sr-only">{code} — </span>
          {name}
        </span>
      ) : (
        <span className="sr-only">{code}</span>
      )}
    </span>
  );
}
