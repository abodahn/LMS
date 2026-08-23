import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import tr from "@/messages/tr.json";
import { LOCALES, RTL_LOCALES, type Locale } from "./constants";

export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  ar: ar as unknown as Dictionary,
  tr: tr as unknown as Dictionary,
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  tr: "Türkçe",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/**
 * `t(dict, "dashboard.greetingMorning", { name: "Ahmed" })`
 * Missing keys fall back to English, then to the key itself — a missing
 * translation degrades to readable text instead of a blank screen.
 */
export function translate(
  dict: Dictionary,
  key: string,
  params?: Record<string, string | number>,
): string {
  const lookup = (source: unknown): string | undefined => {
    let node: unknown = source;
    for (const part of key.split(".")) {
      if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof node === "string" ? node : undefined;
  };

  let value = lookup(dict) ?? lookup(DICTIONARIES.en) ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }
  return value;
}

/** Picks a translated column when present, otherwise the base one. */
export function localized<T extends Record<string, unknown>>(
  row: T,
  base: string,
  locale: Locale,
): string {
  if (locale === "ar") return (row[`${base}Ar`] as string) || (row[base] as string) || "";
  if (locale === "tr") return (row[`${base}Tr`] as string) || (row[base] as string) || "";
  return (row[base] as string) || "";
}

/**
 * Resolves the translated `name` on a list of reference rows.
 *
 * Pickers, filter dropdowns and table cells all render `row.name` straight out
 * of the query, so the language has to be settled where the rows are loaded —
 * doing it in each component would mean threading the locale into a dozen
 * client forms. Rows must be selected with `nameAr`/`nameTr` included; the
 * fallback is the base column, so a partially translated table degrades to
 * English rather than blank.
 */
export function localizeNames<T extends { name: string }>(rows: T[], locale: Locale): T[] {
  if (locale === "en") return rows;
  return rows.map((r) => ({ ...r, name: localized(r, "name", locale) }));
}

/** The `nameAr`/`nameTr` columns `localizeNames` needs, for Prisma `select`. */
export const NAME_I18N_SELECT = { name: true, nameAr: true, nameTr: true } as const;
