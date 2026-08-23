"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction, type ActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? t("common.saving") : t("auth.changePassword")}
    </Button>
  );
}

export function ChangePasswordForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError>{msg(state.error)}</FormError>
      <Field label={t("auth.currentPassword")} required>
        {(p) => <TextInput {...p} name="current" type="password" autoComplete="current-password" required />}
      </Field>
      <Field label={t("auth.newPassword")} required hint={t("auth.passwordTooWeak")}>
        {(p) => <TextInput {...p} name="password" type="password" autoComplete="new-password" required />}
      </Field>
      <Field label={t("auth.confirmPassword")} required>
        {(p) => <TextInput {...p} name="confirm" type="password" autoComplete="new-password" required />}
      </Field>
      <Submit />
    </form>
  );
}
