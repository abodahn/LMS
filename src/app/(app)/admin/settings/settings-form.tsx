"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { LOCALES } from "@/lib/constants";
import { LOCALE_LABELS } from "@/lib/i18n";
import { saveSettingsAction, type SettingsState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

const READINESS_FIELDS: [string, string][] = [
  ["assessment", "Assessment"],
  ["training", "Training"],
  ["improvement", "Improvement"],
  ["responsibleAi", "Responsible AI"],
  ["application", "Application"],
];

export function SettingsForm({
  values,
}: {
  values: {
    completionThreshold: number;
    finalPassScore: number;
    responsibleAiMandatory: boolean;
    capstoneRequired: boolean;
    reviewIntervalDays: number;
    sessionHours: number;
    maxFailedLogins: number;
    lockoutMinutes: number;
    defaultLocale: string;
    readiness: Record<string, number>;
  };
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<SettingsState, FormData>(saveSettingsAction, {});

  return (
    <form action={action} className="space-y-5">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.certificationPolicy")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {t("form.certificateRuleHint")}
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label={t("form.requiredCompletion")} required>
            {(p) => (
              <TextInput
                {...p}
                name="completionThreshold"
                type="number"
                min={0}
                max={100}
                required
                defaultValue={values.completionThreshold}
              />
            )}
          </Field>
          <Field label={t("form.finalPassScore")} required>
            {(p) => (
              <TextInput
                {...p}
                name="finalPassScore"
                type="number"
                min={0}
                max={100}
                required
                defaultValue={values.finalPassScore}
              />
            )}
          </Field>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Checkbox
            name="responsibleAiMandatory"
            defaultChecked={values.responsibleAiMandatory}
            label={t("form.responsibleAiRequired")}
          />
          <Checkbox
            name="capstoneRequired"
            defaultChecked={values.capstoneRequired}
            label={t("form.capstoneRequired")}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.readinessIndex")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {t("form.weightsHint")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {READINESS_FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              {(p) => (
                <TextInput
                  {...p}
                  name={`readiness.${key}`}
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={values.readiness[key] ?? 0}
                />
              )}
            </Field>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">Catalog &amp; security</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("form.reviewIntervalDays")} required>
            {(p) => (
              <TextInput
                {...p}
                name="reviewIntervalDays"
                type="number"
                min={30}
                max={1095}
                required
                defaultValue={values.reviewIntervalDays}
              />
            )}
          </Field>
          <Field label={t("form.sessionHours")} required>
            {(p) => (
              <TextInput {...p} name="sessionHours" type="number" min={1} max={168} required defaultValue={values.sessionHours} />
            )}
          </Field>
          <Field label={t("form.maxFailedLogins")} required>
            {(p) => (
              <TextInput
                {...p}
                name="maxFailedLogins"
                type="number"
                min={3}
                max={20}
                required
                defaultValue={values.maxFailedLogins}
              />
            )}
          </Field>
          <Field label={t("form.lockoutMinutes")} required>
            {(p) => (
              <TextInput
                {...p}
                name="lockoutMinutes"
                type="number"
                min={1}
                max={1440}
                required
                defaultValue={values.lockoutMinutes}
              />
            )}
          </Field>
          <Field label={t("form.defaultLanguage")} required>
            {(p) => (
              <Select {...p} name="defaultLocale" defaultValue={values.defaultLocale}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Card>

      <Submit />
    </form>
  );
}
