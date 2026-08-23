"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { CircleCheck, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, StatusPill } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, TextArea } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { markExternalCompleteAction, uploadProofAction, type LearningState } from "../actions";

function UploadSubmit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      <Upload size={16} />
      {pending ? t("common.saving") : t("learning.uploadProof")}
    </Button>
  );
}

export function ExternalCourseActions({
  enrollmentId,
  courseUrl,
  providerName,
  status,
  proofs,
  certificateAvailable,
  certificateCost,
}: {
  enrollmentId: string;
  courseUrl: string;
  providerName: string;
  status: string;
  proofs: { id: string; fileName: string; status: string; uploadedAt: string; reviewNote: string | null }[];
  certificateAvailable: boolean;
  certificateCost: number | null;
}) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [markPending, startMark] = useTransition();
  const [markState, setMarkState] = useState<LearningState>({});
  const [uploadState, uploadAction] = useActionState<LearningState, FormData>(uploadProofAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">
        {t("learning.externalCourseTitle", { provider: providerName })}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--brand-muted)]">
        {t("learning.externalCourseBody")}
      </p>
      {certificateAvailable ? (
        <p className="mt-2 text-[12px] text-[var(--brand-muted)]">
          {t("certificates.title")}: {certificateCost ? `${certificateCost} USD` : t("common.yes")}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={courseUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand-red)] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-red-dark)]"
        >
          {t("learning.openCourse")}
          <ExternalLink size={16} aria-hidden />
        </a>

        {status !== "COMPLETED" && status !== "PENDING_VERIFICATION" ? (
          <Button
            variant="secondary"
            size="lg"
            disabled={markPending}
            onClick={() =>
              startMark(async () => {
                const res = await markExternalCompleteAction(enrollmentId);
                setMarkState(res);
                router.refresh();
              })
            }
          >
            <CircleCheck size={16} />
            {t("learning.markComplete")}
          </Button>
        ) : null}
      </div>

      <FormSuccess>{msg(markState.success)}</FormSuccess>
      <FormError>{msg(markState.error)}</FormError>

      <form action={uploadAction} className="mt-5 space-y-3 border-t border-[var(--brand-line)] pt-5">
        <input type="hidden" name="enrollmentId" value={enrollmentId} />
        <FormError>{msg(uploadState.error)}</FormError>
        <FormSuccess>{msg(uploadState.success)}</FormSuccess>

        <Field label={t("learning.uploadProof")} hint={t("common.fileHint", { size: "8 MB" })}>
          {(p) => (
            <input
              {...p}
              type="file"
              name="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              required
              className="field file:me-3 file:rounded-md file:border-0 file:bg-[var(--brand-canvas)] file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-[var(--brand-charcoal)]"
            />
          )}
        </Field>

        <Field label={t("toolbox.promptNotes")}>
          {(p) => <TextArea {...p} name="note" rows={2} maxLength={500} />}
        </Field>

        <UploadSubmit />
      </form>

      {proofs.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-[var(--brand-line)] pt-4">
          {proofs.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="min-w-0 truncate text-[var(--brand-ink)]">{p.fileName}</span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--brand-muted)]">{p.uploadedAt}</span>
                <StatusPill
                  status={p.status}
                  label={
                    p.status === "VERIFIED"
                      ? t("learning.proofVerified")
                      : p.status === "REJECTED"
                        ? t("learning.proofRejected")
                        : t("learning.proofPending")
                  }
                />
              </span>
              {p.reviewNote ? (
                <span className="w-full text-[12px] text-[var(--brand-muted)]">{p.reviewNote}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
