"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { addHistoricalTrainingAction, type EnrollmentState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? t("common.saving") : t("common.add")}
    </Button>
  );
}

export function HistoryForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<EnrollmentState, FormData>(addHistoricalTrainingAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("admin.importHistory")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
        {t("form.historyHint")}
      </p>

      <form action={action} className="mt-4 space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("profile.employeeId")} required>
            {(p) => <TextInput {...p} name="employeeCode" required placeholder="TC-1004" />}
          </Field>
          <Field label={t("common.course")} required className="lg:col-span-2">
            {(p) => <TextInput {...p} name="courseName" required maxLength={200} />}
          </Field>
          <Field label={t("form.provider")}>{(p) => <TextInput {...p} name="provider" maxLength={120} />}</Field>
          <Field label={t("certificates.completionDate")} required>
            {(p) => <TextInput {...p} name="completedAt" type="date" required />}
          </Field>
          <Field label={t("common.hours")} required>
            {(p) => <TextInput {...p} name="hours" type="number" min={0} max={1000} step="0.5" required />}
          </Field>
          <Field label={t("form.certificateUrl")} className="lg:col-span-2">
            {(p) => <TextInput {...p} name="certificateUrl" type="url" />}
          </Field>
          <Field label={t("toolbox.promptNotes")}>{(p) => <TextInput {...p} name="note" maxLength={500} />}</Field>
        </div>

        <Submit />
      </form>
    </Card>
  );
}
