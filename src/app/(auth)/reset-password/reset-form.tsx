"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
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

export function ResetForm({ token }: { token: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ActionState, FormData>(resetPasswordAction, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      {!state.success ? (
        <>
          <Field label={t("auth.newPassword")} required>
            {(p) => <TextInput {...p} name="password" type="password" autoComplete="new-password" required />}
          </Field>
          <Field label={t("auth.confirmPassword")} required>
            {(p) => <TextInput {...p} name="confirm" type="password" autoComplete="new-password" required />}
          </Field>
          <Submit />
        </>
      ) : null}

      <p className="pt-1 text-center">
        <Link
          href="/login"
          className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
        >
          {t("auth.backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
