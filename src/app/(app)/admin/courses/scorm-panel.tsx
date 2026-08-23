"use client";

import { useActionState, useState, useTransition } from "react";
import { Package, Trash2, AlertTriangle } from "lucide-react";
import { Alert, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form";
import { useT } from "@/components/i18n-provider";
import { uploadScormAction, removeScormAction, type ScormUploadState } from "./scorm-actions";

export type ScormLessonRow = {
  id: string;
  title: string;
  moduleTitle: string;
  type: string;
  scorm: {
    id: string;
    version: string;
    title: string;
    entryHref: string;
    fileCount: number;
    sizeBytes: number;
    masteryScore: number | null;
  } | null;
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Attaching an authored package to a lesson.
 *
 * Deliberately separate from the structure builder: that edits an unsaved draft
 * of the whole tree, while a package has to be uploaded against a lesson that
 * already exists. Merging the two would mean either saving the structure behind
 * the administrator's back or holding a 200 MB file in browser memory until
 * they pressed save.
 */
export function ScormPanel({ lessons }: { lessons: ScormLessonRow[] }) {
  const t = useT();
  const [state, action, pending] = useActionState<ScormUploadState, FormData>(uploadScormAction, {});
  const [removing, startRemove] = useTransition();
  const [target, setTarget] = useState(lessons[0]?.id ?? "");

  const withPackage = lessons.filter((l) => l.scorm);

  if (lessons.length === 0) return null;

  return (
    <Card className="p-5">
      <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
        <Package size={17} className="text-[var(--brand-red)]" aria-hidden />
        {t("scorm.title")}
      </h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("scorm.uploadHint")}</p>

      <div className="mt-3">
        <Alert tone="warning" icon={<AlertTriangle size={16} aria-hidden />}>
          {t("scorm.trustWarning")}
        </Alert>
      </div>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-[13px]">
          <span className="font-medium text-[var(--brand-ink)]">{t("common.lesson")}</span>
          <select
            name="lessonId"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="field"
            required
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.moduleTitle} — {l.title}
                {l.scorm ? ` (${t("scorm.replace")})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-56 flex-1 flex-col gap-1 text-[13px]">
          <span className="font-medium text-[var(--brand-ink)]">{t("scorm.packageFile")}</span>
          <input type="file" name="file" accept=".zip,application/zip" className="field" required />
        </label>

        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("scorm.upload")}
        </Button>
      </form>

      <FormError>{state.error ? (state.error.includes(".") ? t(state.error) : state.error) : null}</FormError>
      <FormSuccess>{state.success ? t(state.success) : null}</FormSuccess>

      {withPackage.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {withPackage.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3"
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[var(--brand-ink)]">
                  {l.moduleTitle} — {l.title}
                </span>
                <span className="block text-[12px] text-[var(--brand-muted)]">
                  SCORM {l.scorm!.version} · {l.scorm!.fileCount} {t("scorm.files").toLowerCase()} ·{" "}
                  {mb(l.scorm!.sizeBytes)} · {t("scorm.entry")}: {l.scorm!.entryHref}
                  {l.scorm!.masteryScore != null
                    ? ` · ${t("scorm.masteryScore")} ${l.scorm!.masteryScore}`
                    : ""}
                </span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={removing}
                onClick={() => startRemove(() => void removeScormAction(l.id))}
              >
                <Trash2 size={14} />
                {t("scorm.remove")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
