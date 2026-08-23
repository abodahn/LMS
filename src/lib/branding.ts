/**
 * Single source of truth for visual identity. Change values here (or via the
 * matching NEXT_PUBLIC_* env vars) — no component reads a brand colour or the
 * organisation name directly.
 *
 * The colour tokens are injected as CSS custom properties by <BrandStyle/> in
 * the root layout, so Tailwind utilities like `bg-[var(--brand-red)]` and the
 * semantic classes in globals.css both follow this file.
 */

const env = (key: string, fallback: string) => process.env[key] ?? fallback;

export const branding = {
  organizationName: env("NEXT_PUBLIC_ORG_NAME", "T&C Garments"),
  platformName: env("NEXT_PUBLIC_PLATFORM_NAME", "T&C AI Academy"),
  tagline: env("NEXT_PUBLIC_TAGLINE", "Learn AI. Apply AI. Improve Work."),
  logoUrl: env("NEXT_PUBLIC_LOGO_URL", "/brand/logo.svg"),
  logoMarkUrl: env("NEXT_PUBLIC_LOGO_MARK_URL", "/brand/logo-mark.svg"),
  faviconUrl: env("NEXT_PUBLIC_FAVICON_URL", "/brand/favicon.svg"),
  certificateSealUrl: env("NEXT_PUBLIC_SEAL_URL", "/brand/seal.svg"),
  supportEmail: env("NEXT_PUBLIC_SUPPORT_EMAIL", "learning@tcgarments.com"),
  /*
    Taken from the T&C Garments mark.

    The logo red is #ED1C24. White text on it lands at 4.38:1 — just under AA —
    so the *interactive* red is one shade deeper at 5.12:1, which is
    indistinguishable side by side and legible on a button. The logo artwork
    itself keeps the exact colour; this is the standard split between a print
    brand colour and its accessible digital counterpart.

    `redLogo` is available for graphics that carry no text: the mark, rules,
    accent dots, the sweep motif.
  */
  colors: {
    redLogo: env("NEXT_PUBLIC_BRAND_RED_LOGO", "#ED1C24"),
    red: env("NEXT_PUBLIC_BRAND_RED", "#D81B24"),
    redDark: env("NEXT_PUBLIC_BRAND_RED_DARK", "#B3151D"),
    redSoft: env("NEXT_PUBLIC_BRAND_RED_SOFT", "#FEECEC"),
    // The logo's black is warm, not blue-black — the whole neutral ramp follows it.
    ink: env("NEXT_PUBLIC_BRAND_INK", "#231F20"),
    charcoal: env("NEXT_PUBLIC_BRAND_CHARCOAL", "#3B3537"),
    muted: env("NEXT_PUBLIC_BRAND_MUTED", "#6B6668"),
    line: env("NEXT_PUBLIC_BRAND_LINE", "#E6E3E4"),
    surface: env("NEXT_PUBLIC_BRAND_SURFACE", "#FFFFFF"),
    canvas: env("NEXT_PUBLIC_BRAND_CANVAS", "#F7F5F5"),
    success: env("NEXT_PUBLIC_BRAND_SUCCESS", "#16794C"),
    warning: env("NEXT_PUBLIC_BRAND_WARNING", "#B26A00"),
    info: env("NEXT_PUBLIC_BRAND_INFO", "#1F5FA8"),
  },
} as const;

export type Branding = typeof branding;

/** CSS custom properties consumed by globals.css and inline styles. */
export function brandCssVars(): Record<string, string> {
  const c = branding.colors;
  return {
    "--brand-red-logo": c.redLogo,
    "--brand-red": c.red,
    "--brand-red-dark": c.redDark,
    "--brand-red-soft": c.redSoft,
    "--brand-ink": c.ink,
    "--brand-charcoal": c.charcoal,
    "--brand-muted": c.muted,
    "--brand-line": c.line,
    "--brand-surface": c.surface,
    "--brand-canvas": c.canvas,
    "--brand-success": c.success,
    "--brand-warning": c.warning,
    "--brand-info": c.info,
  };
}

/** Deterministic level colours — never the only status signal (see a11y notes). */
/**
 * Level badge fills. Every one carries white text, so each must clear 4.5:1
 * against white — L0 used to be a pale slate that put its own label at 2.56:1.
 * The ramp still reads slate → blue → teal → green → red.
 */
export const LEVEL_COLORS: Record<string, string> = {
  L0: "#5B6675",
  L1: "#1F5FA8",
  L2: "#0E7490",
  L3: "#16794C",
  L4: "#C8102E",
};
