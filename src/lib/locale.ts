import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSessionUser } from "./auth";
import { getDictionary, isLocale, dir } from "./i18n";
import type { Locale } from "./constants";

export const LOCALE_COOKIE = "tcai_locale";

/** Signed-in preference wins; otherwise the cookie set on the login screen. */
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getSessionUser();
  if (user && isLocale(user.locale)) return user.locale;
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : "en";
});

export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale), dir: dir(locale) };
});
