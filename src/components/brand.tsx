import Image from "next/image";
import Link from "next/link";
import { branding, brandCssVars } from "@/lib/branding";
import { cn } from "@/lib/utils";

/** Injects the branding tokens as CSS custom properties on :root. */
export function BrandStyle() {
  const css = Object.entries(brandCssVars())
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return <style dangerouslySetInnerHTML={{ __html: `:root{${css}}` }} />;
}

/**
 * The in-product lockup: the T&C mark, then the platform name as live text.
 *
 * Deliberately not one flat image. The mark is the part that must be exact, and
 * it is — the file is the artwork. The name beside it comes from the branding
 * config, so renaming the platform (or the company) is a config change and not
 * a trip to a design tool, which is what the brief asked for. It also means the
 * wordmark is set in the app's own typeface and inherits its tracking, rather
 * than being a bitmap that never quite matches the page.
 */
export function Logo({
  variant = "full",
  href = "/",
  className,
}: {
  variant?: "full" | "mark";
  href?: string | null;
  className?: string;
}) {
  const mark = (
    <Image
      src={branding.logoMarkUrl}
      alt=""
      width={24}
      height={38}
      priority
      aria-hidden
      className="h-8 w-auto shrink-0"
    />
  );

  const content =
    variant === "mark" ? (
      mark
    ) : (
      <span className="inline-flex items-center gap-2.5">
        {mark}
        <span className="min-w-0 leading-none">
          <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-[var(--brand-ink)]">
            {branding.platformName}
          </span>
          {/* Echoes the tracked capitals under the mark in the company logo. */}
          <span className="mt-1 block truncate text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--brand-muted)]">
            {branding.organizationName}
          </span>
        </span>
      </span>
    );

  if (!href) return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center rounded-[var(--radius-control)]", className)}
      aria-label={branding.platformName}
    >
      {content}
    </Link>
  );
}
