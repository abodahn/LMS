import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BrandStyle } from "@/components/brand";
import { ServiceWorker } from "@/components/service-worker";
import { I18nProvider } from "@/components/i18n-provider";
import { branding } from "@/lib/branding";
import { getI18n } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: branding.platformName,
    template: `%s · ${branding.platformName}`,
  },
  description: `${branding.tagline} — ${branding.organizationName}`,
  icons: {
    icon: branding.faviconUrl,
    // Apple ignores the web manifest and looks for this instead.
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: branding.platformName },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16181D",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dir } = await getI18n();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} h-full antialiased`}>
      <head>
        <BrandStyle />
      </head>
      <body className="min-h-full">
        <I18nProvider locale={locale} dict={dict} dir={dir}>
          {children}
          <ServiceWorker />
        </I18nProvider>
      </body>
    </html>
  );
}
