"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, RadioCard, TextArea } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { submitFeedbackAction, type LearningState } from "../actions";

function Rating({ name, label }: { name: string; label: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <label
            key={v}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border border-[var(--brand-line)] text-sm font-semibold text-[var(--brand-charcoal)] transition-colors hover:border-[var(--brand-charcoal)] has-[:checked]:border-[var(--brand-red)] has-[:checked]:bg-[var(--brand-red)] has-[:checked]:text-white"
          >
            <input type="radio" name={name} value={v} required className="sr-only" />
            {v}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.submit")}
    </Button>
  );
}

export function FeedbackForm({ enrollmentId }: { enrollmentId: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<LearningState, FormData>(submitFeedbackAction, {});

  if (state.success) return <FormSuccess>{msg(state.success)}</FormSuccess>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <FormError>{msg(state.error)}</FormError>

      <Rating name="usefulness" label={t("learning.feedbackUsefulness")} />
      <Rating name="relevance" label={t("learning.feedbackRelevance")} />

      <fieldset>
        <legend className="label">{t("learning.feedbackRecommend")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <RadioCard name="wouldRecommend" value="yes" label={t("common.yes")} required />
          <RadioCard name="wouldRecommend" value="no" label={t("common.no")} />
        </div>
      </fieldset>

      <Field label={t("learning.feedbackComment")}>
        {(p) => <TextArea {...p} name="comment" rows={3} maxLength={1000} />}
      </Field>

      <Submit />
    </form>
  );
}
