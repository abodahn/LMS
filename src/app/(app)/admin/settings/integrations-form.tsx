"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { saveAiIntegrationAction, saveSmtpAction, type SettingsState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function IntegrationsForm({
  ai,
  smtp,
}: {
  ai: { enabled: boolean; provider: string; model: string; baseUrl: string; maxTokens: number };
  smtp: { enabled: boolean; host: string; port: number; user: string; from: string };
}) {
  const t = useT();
  const msg = useMessage();
  const [aiState, saveAi] = useActionState<SettingsState, FormData>(saveAiIntegrationAction, {});
  const [smtpState, saveSmtp] = useActionState<SettingsState, FormData>(saveSmtpAction, {});

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.aiProvider")}</h2>
        <form action={saveAi} className="mt-4 space-y-4">
          <FormError>{msg(aiState.error)}</FormError>
          <FormSuccess>{msg(aiState.success)}</FormSuccess>

          <Alert tone="info">
            {t("form.apiKeyHint")}
          </Alert>

          <Checkbox
            name="enabled"
            defaultChecked={ai.enabled}
            label={t("form.enableAi")}
            description="AI coach, explanations and draft generation"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("form.provider")} required>
              {(p) => (
                <Select {...p} name="provider" defaultValue={ai.provider}>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="compatible">{t("form.openAiCompatible")}</option>
                </Select>
              )}
            </Field>
            <Field label={t("form.model")} required>
              {(p) => <TextInput {...p} name="model" required maxLength={80} defaultValue={ai.model} />}
            </Field>
            <Field label={t("form.baseUrl")} hint={t("form.baseUrlHint")}>
              {(p) => <TextInput {...p} name="baseUrl" type="url" defaultValue={ai.baseUrl} />}
            </Field>
            <Field label={t("form.maxTokens")} hint={t("ai.maxTokensHint")} required>
              {(p) => (
                <TextInput {...p} name="maxTokens" type="number" min={128} max={8192} required defaultValue={ai.maxTokens} />
              )}
            </Field>
          </div>

          <Submit />
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.smtpEmail")}</h2>
        <form action={saveSmtp} className="mt-4 space-y-4">
          <FormError>{msg(smtpState.error)}</FormError>
          <FormSuccess>{msg(smtpState.success)}</FormSuccess>

          <Alert tone="info">
            {t("form.smtpHint")}
          </Alert>

          <Checkbox name="enabled" defaultChecked={smtp.enabled} label={t("form.enableEmail")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("form.host")}>
              {(p) => <TextInput {...p} name="host" maxLength={200} defaultValue={smtp.host} />}
            </Field>
            <Field label={t("form.port")}>
              {(p) => <TextInput {...p} name="port" type="number" min={1} max={65535} defaultValue={smtp.port} />}
            </Field>
            <Field label={t("form.user")}>
              {(p) => <TextInput {...p} name="user" maxLength={200} defaultValue={smtp.user} />}
            </Field>
            <Field label={t("form.fromAddress")}>
              {(p) => <TextInput {...p} name="from" maxLength={200} defaultValue={smtp.from} />}
            </Field>
          </div>

          <Submit />
        </form>
      </Card>
    </div>
  );
}
