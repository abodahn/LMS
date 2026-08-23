"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n-provider";
import { revokeCertificateAction } from "./actions";

export function RevokeCertificate({ certificateId }: { certificateId: string }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-red)] hover:underline"
      >
        {t("certificates.revoked")}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("admin.rejectionReason")}
        aria-label={t("admin.rejectionReason")}
        className="field h-8 w-40 text-[12px]"
      />
      <button
        type="button"
        disabled={pending || reason.trim().length < 3}
        onClick={() =>
          start(async () => {
            await revokeCertificateAction(certificateId, reason.trim());
            setOpen(false);
            router.refresh();
          })
        }
        className="rounded-[var(--radius-control)] bg-[var(--brand-red)] px-2 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
      >
        {t("common.confirm")}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-[12px] text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
      >
        {t("common.cancel")}
      </button>
    </span>
  );
}
