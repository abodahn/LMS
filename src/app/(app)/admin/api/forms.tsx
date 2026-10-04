"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import {
  createApiKeyAction,
  createWebhookAction,
  deleteWebhookAction,
  revokeApiKeyAction,
  toggleWebhookAction,
  type ApiAdminState,
} from "./actions";

const EVENTS = ["course.completed", "certificate.issued"] as const;

function Submit({ label, variant = "primary", ariaLabel }: { label: string; variant?: "primary" | "ghost"; ariaLabel?: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending} aria-label={ariaLabel}>
      {pending ? t("common.saving") : label}
    </Button>
  );
}

/** Shown once, straight after creation; gone on the next page load. */
function OneTimeSecret({ value }: { value?: string }) {
  const t = useT();
  if (!value) return null;
  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-[var(--brand-canvas)] p-3" role="status">
      <p className="text-[12px] font-medium text-[var(--brand-ink)]">{t("api.copyNow")}</p>
      <code className="mt-1 block select-all break-all font-mono text-[12px]" dir="ltr">
        {value}
      </code>
    </div>
  );
}

export function CreateKeyForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ApiAdminState, FormData>(createApiKeyAction, {});
  return (
    <form action={action} className="space-y-3">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <OneTimeSecret value={state.secret} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("api.keyName")} hint={t("api.keyNameHint")} required className="min-w-[240px] flex-1">
          {(p) => <TextInput {...p} name="name" required minLength={2} maxLength={80} />}
        </Field>
        <Submit label={t("api.createKey")} />
      </div>
    </form>
  );
}

export function RevokeKey({ id, name }: { id: string; name: string }) {
  const t = useT();
  const [, action] = useActionState<ApiAdminState, FormData>(revokeApiKeyAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Submit label={t("api.revoke")} variant="ghost" ariaLabel={`${t("api.revoke")}: ${name}`} />
    </form>
  );
}

export function CreateWebhookForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ApiAdminState, FormData>(createWebhookAction, {});
  return (
    <form action={action} className="space-y-3">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <OneTimeSecret value={state.secret} />
      <Field label={t("api.webhookUrl")} hint={t("api.webhookUrlHint")} required>
        {(p) => <TextInput {...p} name="url" type="url" required maxLength={500} dir="ltr" placeholder="https://" />}
      </Field>
      <fieldset>
        <legend className="mb-1 text-[13px] font-medium text-[var(--brand-ink)]">{t("api.events")}</legend>
        <div className="flex flex-wrap gap-4">
          {EVENTS.map((e) => (
            <Checkbox key={e} name="events" value={e} defaultChecked label={t(`api.event.${e.replace(".", "_")}`)} />
          ))}
        </div>
      </fieldset>
      <Submit label={t("api.addWebhook")} />
    </form>
  );
}

export function WebhookControls({ id, isActive, host }: { id: string; isActive: boolean; host: string }) {
  const t = useT();
  const msg = useMessage();
  const [toggled, toggle] = useActionState<ApiAdminState, FormData>(toggleWebhookAction, {});
  const [removed, remove] = useActionState<ApiAdminState, FormData>(deleteWebhookAction, {});
  const error = toggled.error ?? removed.error;
  return (
    <div className="flex items-center gap-2">
      {error ? (
        <span role="status" className="text-[12px] text-[var(--brand-red)]">
          {msg(error)}
        </span>
      ) : null}
      <form action={toggle}>
        <input type="hidden" name="id" value={id} />
        <Submit
          label={isActive ? t("challenges.pause") : t("challenges.resume")}
          variant="ghost"
          ariaLabel={`${isActive ? t("challenges.pause") : t("challenges.resume")}: ${host}`}
        />
      </form>
      <form
        action={remove}
        onSubmit={(e) => {
          if (!window.confirm(t("api.confirmRemove", { host }))) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Submit label={t("common.remove")} variant="ghost" ariaLabel={`${t("common.remove")}: ${host}`} />
      </form>
    </div>
  );
}
