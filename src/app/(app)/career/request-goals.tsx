"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { requestCareerGoalsAction, type CareerState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? t("common.saving") : t("career.askManager")}
    </Button>
  );
}

export function RequestGoals({ jobTitleId }: { jobTitleId: string }) {
  const msg = useMessage();
  const [state, action] = useActionState<CareerState, FormData>(requestCareerGoalsAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="jobTitleId" value={jobTitleId} />
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <Submit />
    </form>
  );
}
