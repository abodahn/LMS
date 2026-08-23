"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { replay, pendingWrites } from "@/lib/offline-sync";
import { saveLessonProgressAction } from "@/app/(app)/learning/actions";

/**
 * Connection state, and the queue that depends on it.
 *
 * Two jobs. It tells the interface whether there is a network — so a button can
 * say "saved on this device" instead of lying — and it sends anything queued the
 * moment there is one.
 *
 * `navigator.onLine` is an external store, so it is read through
 * useSyncExternalStore rather than mirrored into state. That also settles the
 * server snapshot honestly: rendering assumes online, because a page rendered on
 * the server self-evidently reached it.
 *
 * Replay runs when the connection returns *and* on mount, because a phone that
 * was switched off and back on never fires `online` — it simply starts up
 * connected, and the queue would otherwise wait for a transition that may not
 * come for hours.
 */

type OfflineState = {
  online: boolean;
  queued: number;
  /** Re-count after a write, so the badge is honest immediately. */
  refresh: () => void;
};

const Ctx = createContext<OfflineState>({ online: true, queued: 0, refresh: () => {} });

export const useOffline = () => useContext(Ctx);

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function OfflineProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const t = useT();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    // Server render: a page that reached the server was online.
    () => true,
  );

  const [queued, setQueued] = useState(0);
  const flushing = useRef(false);

  /**
   * Sends anything queued, then recounts.
   *
   * Every setState here happens after an await, inside an async callback —
   * never synchronously in an effect body, which would cascade renders.
   */
  const sync = useCallback(async () => {
    if (navigator.onLine && !flushing.current) {
      flushing.current = true;
      try {
        await replay(saveLessonProgressAction as never, userId);
      } catch {
        // Leave the queue; the next trigger tries again.
      } finally {
        flushing.current = false;
      }
    }

    try {
      const rows = await pendingWrites(userId);
      setQueued(rows.length);
    } catch {
      // No IndexedDB (private mode, an old browser): the app still works, it
      // just cannot promise to hold work while offline.
    }
  }, [userId]);

  useEffect(() => {
    // Subscribing to an external system — the network and the device's own
    // queue — and reflecting what it says. The rule guards against cascading
    // renders from a synchronous setState; every write in `sync` happens after
    // an await, which the rule cannot see through.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sync();
  }, [online, sync]);

  const showBanner = !online || queued > 0;
  // Online with a queue still draining is the only state worth a spinner.
  const syncing = online && queued > 0;

  return (
    <Ctx.Provider value={{ online, queued, refresh: () => void sync() }}>
      {children}

      {showBanner ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-[var(--brand-ink)] px-4 py-2 text-[13px] font-medium text-white"
        >
          {syncing ? (
            <RefreshCw size={14} className="animate-spin" aria-hidden />
          ) : (
            <WifiOff size={14} aria-hidden />
          )}
          <span>
            {!online
              ? queued > 0
                ? t("offline.bannerQueued", { count: String(queued) })
                : t("offline.banner")
              : t("offline.bannerSyncing", { count: String(queued) })}
          </span>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
