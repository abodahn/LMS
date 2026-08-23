import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Offline" };

/**
 * What the service worker serves when a navigation cannot reach the network.
 *
 * Static on purpose: it has to render from the cache with no session, no
 * database and no data of its own, so it says nothing about who is signed in.
 * The reassurance about queued work is the important part — a learner who has
 * just completed a lesson in a dead zone needs to know it was not thrown away.
 */
export default async function OfflinePage() {
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--brand-canvas)] px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-red-soft)] text-[var(--brand-red)]">
          <WifiOff size={22} aria-hidden />
        </span>

        <h1 className="mt-4 text-lg font-semibold text-[var(--brand-ink)]">{t("offline.title")}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--brand-muted)]">{t("offline.body")}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--brand-muted)]">{t("offline.queued")}</p>

        <p className="mt-6 text-[12px] text-[var(--brand-muted)]">{t("offline.retryHint")}</p>
      </div>
    </main>
  );
}
