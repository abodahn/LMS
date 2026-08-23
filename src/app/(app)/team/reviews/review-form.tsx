"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, RadioCard, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { reviewCapstoneAction, type CapstoneState } from "@/app/(app)/capstone/actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.submit")}
    </Button>
  );
}

export function CapstoneReviewForm({ submissionId, maxScore }: { submissionId: string; maxScore: number }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<CapstoneState, FormData>(reviewCapstoneAction, {});

  if (state.success) return <FormSuccess>{msg(state.success)}</FormSuccess>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      <FormError>{msg(state.error)}</FormError>

      <fieldset>
        <legend className="label">{t("common.status")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <RadioCard name="decision" value="APPROVED" label={t("capstone.approved")} required />
          <RadioCard name="decision" value="NEEDS_WORK" label={t("capstone.needsWork")} />
        </div>
      </fieldset>

      <Field label={`${t("common.score")} / ${maxScore}`}>
        {(p) => <TextInput {...p} name="score" type="number" min={0} max={maxScore} />}
      </Field>

      <Field label={t("capstone.reviewerFeedback")} required>
        {(p) => <TextArea {...p} name="feedback" rows={3} required maxLength={3000} />}
      </Field>

      <Submit />
    </form>
  );
}
