"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveGoalsStep, type OnboardingState } from "../actions";
import { Button } from "@/components/ui/button";
import { Checkbox, FormError } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { LEARNING_GOALS } from "@/lib/constants";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? t("common.saving") : t("assessment.startPath")}
    </Button>
  );
}

export function GoalsForm({ selected }: { selected: string[] }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OnboardingState, FormData>(saveGoalsStep, {});

  return (
    <form action={action} className="space-y-5">
      <FormError>{msg(state.error)}</FormError>

      <fieldset>
        <legend className="sr-only">{t("onboarding.goalsTitle")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEARNING_GOALS.map((g) => (
            <Checkbox key={g} name="goals" value={g} defaultChecked={selected.includes(g)} label={t(`goals.${g}`)} />
          ))}
        </div>
      </fieldset>

      <Submit />
    </form>
  );
}
