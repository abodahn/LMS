"use client";

import { useEffect } from "react";

/**
 * Registers the service worker.
 *
 * Only in production: in development Next serves uncached, uncompiled modules
 * and a worker sitting in front of them makes every rebuild a debugging session
 * about stale files rather than about the change.
 *
 * Registration is deferred to `load` so it never competes with the first render
 * — on the phones this is aimed at, that contention is measurable.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Blocked by policy, or an unsupported context. The app is fully
        // functional without it; only the offline screen is lost.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

/**
 * Wipes every cache the worker holds.
 *
 * Called on sign-out. These phones get handed between shifts, and "the previous
 * person's stuff is still here" is the kind of thing that ends a rollout.
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: "clear-caches" });
}
