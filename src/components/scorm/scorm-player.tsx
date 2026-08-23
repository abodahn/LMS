"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n-provider";
import { commitScormAction } from "@/app/(app)/learn/scorm-actions";

/**
 * The SCORM runtime, as content expects to find it.
 *
 * A package is not handed an API — it *hunts* for one, walking `window.parent`
 * until it finds an object called `API` (SCORM 1.2) or `API_1484_11` (2004).
 * That search is the entire integration contract, and it has two consequences
 * that shape this component:
 *
 *  - The content must be same-origin, or the walk hits a cross-origin frame and
 *    throws. See lib/scorm/package.ts for what that costs and how it is fenced.
 *  - The API has to exist *before* the package starts loading. The iframe is
 *    therefore rendered without a `src` and navigated from the effect below,
 *    once the API is installed. Setting `src` in JSX would let the browser begin
 *    fetching during commit, ahead of any effect.
 *
 * Both APIs are published regardless of the version the manifest declared,
 * because packages are routinely mislabelled and content that finds neither
 * simply fails.
 *
 * Both are synchronous by specification: `LMSGetValue` must return a string
 * immediately, so nothing here can await the server. The CMI map is held in
 * memory and flushed on commit, on finish, on a timer and on page hide — which
 * is the same durability SCORM itself promises.
 */

type CmiMap = Record<string, string>;

type Props = {
  packageId: string;
  enrollmentId: string;
  launchUrl: string;
  initialCmi: CmiMap;
  title: string;
};

const NO_ERROR = "0";
const NOT_INITIALISED = "301";
const ELEMENT_READ_ONLY = "403";

const ERROR_TEXT: Record<string, string> = {
  [NO_ERROR]: "No error",
  [NOT_INITIALISED]: "Not initialized",
  [ELEMENT_READ_ONLY]: "Element is read only",
};

export function ScormPlayer({ packageId, enrollmentId, launchUrl, initialCmi, title }: Props) {
  const t = useT();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const frame = useRef<HTMLIFrameElement>(null);
  // Refs rather than state throughout: the API is called synchronously from
  // another frame and must never read a stale render.
  const cmi = useRef<CmiMap>({ ...initialCmi });
  const dirty = useRef(false);
  const initialised = useRef(false);
  const lastError = useRef(NO_ERROR);
  const startedAt = useRef(0);
  const committing = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    let disposed = false;

    const flush = async () => {
      if (!dirty.current || committing.current) return;
      committing.current = true;
      const payload = { ...cmi.current };
      dirty.current = false;
      try {
        const result = await commitScormAction({
          packageId,
          enrollmentId,
          cmi: payload,
          sessionSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        });
        if (disposed) return;
        setFailed(false);
        setMessage(result.lessonCompleted ? t("scorm.completed") : t("scorm.saved"));
      } catch {
        // Put the flag back so the next flush retries rather than losing it.
        dirty.current = true;
        if (disposed) return;
        setFailed(true);
        setMessage(t("scorm.saveFailed"));
      } finally {
        committing.current = false;
      }
    };

    const get = (key: string): string => {
      if (!initialised.current) {
        lastError.current = NOT_INITIALISED;
        return "";
      }
      lastError.current = NO_ERROR;
      return cmi.current[key] ?? "";
    };

    const set = (key: string, value: unknown): string => {
      if (!initialised.current) {
        lastError.current = NOT_INITIALISED;
        return "false";
      }
      cmi.current[key] = String(value);
      dirty.current = true;
      lastError.current = NO_ERROR;
      return "true";
    };

    const initialize = () => {
      initialised.current = true;
      startedAt.current = Date.now();
      lastError.current = NO_ERROR;
      return "true";
    };

    const finish = () => {
      initialised.current = false;
      void flush();
      lastError.current = NO_ERROR;
      return "true";
    };

    const commit = () => {
      void flush();
      lastError.current = NO_ERROR;
      return "true";
    };

    const errorString = (code: string) => ERROR_TEXT[code] ?? "";

    const api12 = {
      LMSInitialize: initialize,
      LMSFinish: finish,
      LMSGetValue: get,
      LMSSetValue: set,
      LMSCommit: commit,
      LMSGetLastError: () => lastError.current,
      LMSGetErrorString: errorString,
      LMSGetDiagnostic: errorString,
    };

    const api2004 = {
      Initialize: initialize,
      Terminate: finish,
      GetValue: get,
      SetValue: set,
      Commit: commit,
      GetLastError: () => lastError.current,
      GetErrorString: errorString,
      GetDiagnostic: errorString,
    };

    const w = window as unknown as Record<string, unknown>;
    w.API = api12;
    w.API_1484_11 = api2004;

    // Only now is it safe to let the package load.
    if (frame.current && !frame.current.src) frame.current.src = launchUrl;

    // Content that never calls Commit still gets saved.
    const timer = setInterval(() => void flush(), 60_000);
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      void flush();
      delete w.API;
      delete w.API_1484_11;
    };
  }, [packageId, enrollmentId, launchUrl, t]);

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-black">
        <iframe
          ref={frame}
          title={title}
          className="h-full w-full"
          // Same-origin is required for the API hunt above; scripts and forms
          // are what an interactive package is made of. Top-level navigation
          // and downloads stay blocked.
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="autoplay; fullscreen"
        />
      </div>

      <p className="text-[12px] text-[var(--brand-muted)]" role="status" aria-live="polite">
        {failed ? (
          <span className="text-[var(--brand-red)]">{message}</span>
        ) : (
          message || t("scorm.tracking")
        )}
      </p>
    </div>
  );
}
