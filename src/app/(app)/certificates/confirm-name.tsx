"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { confirmCertificateNameAction, type NameState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("certificates.confirmName")}
    </Button>
  );
}

export function ConfirmName({ suggested }: { suggested: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<NameState, FormData>(confirmCertificateNameAction, {});
  return (
    <form action={action} className="mt-4 space-y-3">
      <FormError>{msg(state.error)}</FormError>
      <Field label={t("certificates.nameLabel")} hint={t("certificates.nameHint")} required>
        {(p) => (
          <TextInput {...p} name="certificateName" defaultValue={suggested} required minLength={3} maxLength={80} dir="auto" autoComplete="name" />
        )}
      </Field>
      <Submit />
    </form>
  );
}
