"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translate, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";

type Ctx = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  dict,
  dir,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  dir: "rtl" | "ltr";
  children: ReactNode;
}) {
  const value = useMemo<Ctx>(
    () => ({ locale, dir, t: (key, params) => translate(dict, key, params) }),
    [locale, dict, dir],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

/**
 * Server actions return dictionary keys, optionally with one argument after a
 * colon ("auth.accountLocked:5"). This resolves them on the client so error
 * text follows the user's language.
 */
export function useMessage() {
  const { t } = useI18n();
  return (code?: string | null) => {
    if (!code) return null;
    const [key, arg] = code.split(":");
    return t(key, arg ? { minutes: arg, count: arg, time: arg, size: arg, types: arg } : undefined);
  };
}
