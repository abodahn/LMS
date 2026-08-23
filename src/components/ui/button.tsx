import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-dark)]",
  secondary:
    "bg-[var(--brand-surface)] text-[var(--brand-ink)] border border-[var(--brand-line)] hover:border-[var(--brand-line-strong)] hover:bg-[var(--brand-canvas)]",
  ghost: "text-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]",
  danger:
    "bg-[var(--brand-surface)] text-[var(--brand-red)] border border-[color-mix(in_srgb,var(--brand-red)_40%,transparent)] hover:bg-[var(--brand-red-soft)] hover:border-[var(--brand-red)]",
  quiet: "bg-[var(--brand-ink)] text-white hover:bg-[var(--brand-charcoal)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-[var(--radius-control)] font-semibold whitespace-nowrap",
    // A press that moves is worth 100ms of animation; nothing else here is.
    "transition-[background-color,border-color,transform] duration-150 active:scale-[0.985]",
    "disabled:opacity-45 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
};

export function Button({ variant = "primary", size = "md", full, className, ...props }: ButtonProps) {
  return <button {...props} className={buttonClass(variant, size, cn(full && "w-full", className))} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
};

export function LinkButton({ variant = "primary", size = "md", full, className, ...props }: LinkButtonProps) {
  return <Link {...props} className={buttonClass(variant, size, cn(full && "w-full", className))} />;
}
