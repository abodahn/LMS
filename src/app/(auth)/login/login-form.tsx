"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? t("auth.signingIn") : t("auth.signIn")}
    </Button>
  );
}

export function LoginForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError>{msg(state.error)}</FormError>

      <Field label={t("auth.identifier")} required>
        {(p) => (
          <TextInput
            {...p}
            name="identifier"
            autoComplete="username"
            autoFocus
            required
            placeholder="TC-1042"
          />
        )}
      </Field>

      <Field label={t("auth.password")} required>
        {(p) => <TextInput {...p} name="password" type="password" autoComplete="current-password" required />}
      </Field>

      <SubmitButton />

      <p className="pt-1 text-center">
        <Link
          href="/forgot-password"
          className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
        >
          {t("auth.forgotPassword")}
        </Link>
      </p>

      <p className="text-center text-[13px] text-[var(--brand-muted)]">
        {t("auth.noAccountYet")}{" "}
        <Link
          href="/register"
          className="font-medium text-[var(--brand-red)] underline-offset-4 hover:underline"
        >
          {t("auth.registerLink")}
        </Link>
      </p>
    </form>
  );
}
