"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleCheck } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { saveLessonProgressAction } from "@/app/(app)/learning/actions";
import { saveOrQueue } from "@/lib/offline-sync";
import { useOffline } from "@/components/offline-provider";

/**
 * Time on the lesson is measured client-side and flushed on unload / complete.
 *
 * Progress is never lost, and that now holds without a network: a completion
 * that cannot reach the server is written to IndexedDB and replayed when the
 * connection returns. The learner is told which of the two happened rather than
 * being shown a cheerful tick either way — "saved" and "saved on this device"
 * are different promises.
 */
export function LessonFooter({
  userId,
  enrollmentId,
  lessonId,
  completed,
  previousHref,
  nextHref,
  isLast,
}: {
  userId: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  previousHref: string | null;
  nextHref: string;
  isLast: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(completed);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [queuedLocally, setQueuedLocally] = useState(false);
  const { refresh } = useOffline();
  const openedAt = useRef(0);
  const flushed = useRef(false);

  const elapsed = () =>
    openedAt.current ? Math.min(3 * 3600, Math.round((Date.now() - openedAt.current) / 1000)) : 0;

  // Record dwell time even if the learner navigates away without completing.
  useEffect(() => {
    openedAt.current = Date.now();
    const flush = () => {
      if (flushed.current) return;
      flushed.current = true;
      const seconds = elapsed();
      if (seconds < 5) return;
      void saveOrQueue(
        saveLessonProgressAction as never,
        { enrollmentId, lessonId, secondsSpent: seconds },
        userId,
      );
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [enrollmentId, lessonId, userId]);

  function complete() {
    flushed.current = true;
    start(async () => {
      const result = await saveOrQueue(
        saveLessonProgressAction as never,
        { enrollmentId, lessonId, secondsSpent: elapsed(), completed: true },
        userId,
      );

      if (result.error) {
        setError(t(result.error));
        return;
      }

      setIsComplete(true);
      setError(null);

      if (!result.delivered) {
        // Held on the device. Say so, and stay put: the next lesson would be
        // rendered from a server that cannot be reached.
        setQueuedLocally(true);
        refresh();
        return;
      }

      router.push(nextHref);
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {error ? (
        <p role="alert" className="mb-3 text-[13px] font-medium text-[var(--brand-red)]">
          {error}
        </p>
      ) : null}

      {queuedLocally ? (
        <p role="status" className="mb-3 text-[13px] font-medium text-[var(--brand-ink)]">
          {t("offline.savedOnDevice")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {previousHref ? (
          <LinkButton href={previousHref} variant="secondary">
            <ArrowLeft size={16} className="rtl:rotate-180" />
            {t("common.previous")}
          </LinkButton>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-success)]">
              <CircleCheck size={16} aria-hidden />
              {t("learning.lessonCompleted")}
            </span>
          ) : (
            <Button onClick={complete} disabled={pending}>
              <Check size={16} />
              {pending ? t("common.saving") : t("learning.lessonComplete")}
            </Button>
          )}

          <LinkButton href={nextHref} variant={isComplete ? "primary" : "secondary"}>
            {isLast ? t("common.finish") : t("common.next")}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
