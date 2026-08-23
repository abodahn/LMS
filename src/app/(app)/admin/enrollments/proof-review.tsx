"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess, RadioCard, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { reviewProofAction, type EnrollmentState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : t("common.submit")}
    </Button>
  );
}

export function ProofReview({ proofId }: { proofId: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<EnrollmentState, FormData>(reviewProofAction, {});

  if (state.success) return <FormSuccess>{msg(state.success)}</FormSuccess>;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="proofId" value={proofId} />
      <FormError>{msg(state.error)}</FormError>

      <div className="grid gap-2 sm:grid-cols-2">
        <RadioCard name="decision" value="VERIFIED" label={t("learning.proofVerified")} required />
        <RadioCard name="decision" value="REJECTED" label={t("learning.proofRejected")} />
      </div>

      <TextInput name="note" maxLength={1000} placeholder={t("capstone.reviewerFeedback")} aria-label={t("capstone.reviewerFeedback")} />

      <Submit />
    </form>
  );
}
