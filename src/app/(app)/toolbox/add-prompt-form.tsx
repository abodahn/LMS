"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { addSavedPromptAction, type ToolboxState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function AddPromptForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ToolboxState, FormData>(addSavedPromptAction, {});

  return (
    <form action={action} className="space-y-4">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <Field label={t("toolbox.promptTitle")} required>
        {(p) => <TextInput {...p} name="title" required maxLength={120} />}
      </Field>
      <Field label={t("toolbox.promptBody")} required>
        {(p) => <TextArea {...p} name="body" rows={5} required maxLength={6000} />}
      </Field>
      <Field label={t("toolbox.promptNotes")}>
        {(p) => <TextArea {...p} name="notes" rows={2} maxLength={1000} />}
      </Field>
      <Submit />
    </form>
  );
}
