"use client";

/**
 * Last-resort error boundary.
 *
 * This replaces the root layout when the layout itself fails, so it must not
 * import the i18n provider, the branding module, or anything else that could be
 * the thing that broke. Everything it needs is inline: three short strings and
 * literal colours matching the brand tokens.
 *
 * Locale is read from the cookie rather than the user record, because there is
 * no server round trip to be had here. A signed-in learner whose preference
 * differs from the cookie sees English — acceptable on a crash screen, and far
 * better than a blank page.
 */

const COPY = {
  en: {
    title: "Something went wrong",
    body: "We could not load the page. Your progress is safe. Please try again.",
    retry: "Try again",
    dir: "ltr",
  },
  ar: {
    title: "حدث خطأ ما",
    body: "تعذّر تحميل الصفحة. تقدّمك محفوظ. من فضلك حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
    dir: "rtl",
  },
  tr: {
    title: "Bir şeyler ters gitti",
    body: "Sayfa yüklenemedi. İlerlemeniz güvende. Lütfen tekrar deneyin.",
    retry: "Tekrar dene",
    dir: "ltr",
  },
} as const;

function resolveLocale(): keyof typeof COPY {
  if (typeof document === "undefined") return "en";
  const fromCookie = document.cookie.match(/(?:^|;\s*)tcai_locale=(en|ar|tr)\b/)?.[1];
  if (fromCookie) return fromCookie as keyof typeof COPY;
  const nav = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en";
  return nav === "ar" || nav === "tr" ? nav : "en";
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = resolveLocale();
  const t = COPY[locale];

  return (
    <html lang={locale} dir={t.dir}>
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F5F5",
          color: "#231F20",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em" }}>{t.title}</h1>
          <p style={{ marginTop: 8, color: "#6B6668", fontSize: 14, lineHeight: 1.6 }}>{t.body}</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 8,
              border: 0,
              background: "#D81B24",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.retry}
          </button>
          {/* The reference, never the stack trace. */}
          {error.digest ? (
            <p style={{ marginTop: 16, color: "#6B6668", fontSize: 12 }}>{error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
