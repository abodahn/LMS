"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/form";
import { useT } from "@/components/i18n-provider";
import { registerAction, type ActionState } from "../actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? t("common.saving") : t("auth.createAccount")}
    </Button>
  );
}

export function RegisterForm() {
  const t = useT();
  const [state, action] = useActionState<ActionState, FormData>(registerAction, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label={t("auth.employeeId")} required>
        {(p) => (
          <TextInput
            {...p}
            name="employeeCode"
            autoComplete="username"
            placeholder="TC-1042"
            required
            maxLength={40}
          />
        )}
      </Field>

      <Field label={t("auth.workEmail")} hint={t("auth.workEmailHint")} required>
        {(p) => (
          <TextInput {...p} name="email" type="email" autoComplete="email" required maxLength={200} />
        )}
      </Field>

      <Field label={t("auth.choosePassword")} hint={t("auth.passwordRule")} required>
        {(p) => (
          <TextInput
            {...p}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
        )}
      </Field>

      <Field label={t("auth.confirmPassword")} required>
        {(p) => (
          <TextInput
            {...p}
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
        )}
      </Field>

      <FormError>{state.error ? t(state.error) : null}</FormError>
      <Submit />
    </form>
  );
}
