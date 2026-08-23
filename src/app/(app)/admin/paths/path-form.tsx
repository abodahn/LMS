"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { JOB_FAMILIES, LEVEL_CODES } from "@/lib/constants";
import { humanizeKey } from "@/lib/utils";
import { savePathAction, type PathState } from "./actions";

export type PathValues = {
  id?: string;
  code: string;
  title: string;
  titleAr: string;
  titleTr: string;
  description: string;
  targetHours: number;
  targetLevelId: string;
  audienceLevel: string;
  status: string;
  isDefault: boolean;
  isTechnical: boolean;
  jobFamilies: string[];
};

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function PathForm({
  values,
  levels,
}: {
  values: PathValues;
  levels: { id: string; code: string; name: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<PathState, FormData>(savePathAction, {});

  return (
    <form action={action} className="space-y-5">
      {values.id ? <input type="hidden" name="pathId" value={values.id} /> : null}
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <Card className="p-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("form.code")} required>
            {(p) => <TextInput {...p} name="code" required maxLength={60} defaultValue={values.code} />}
          </Field>
          <Field label={t("form.titleEn")} required className="lg:col-span-2">
            {(p) => <TextInput {...p} name="title" required maxLength={200} defaultValue={values.title} />}
          </Field>
          <Field label={t("form.titleAr")}>
            {(p) => <TextInput {...p} name="titleAr" dir="rtl" maxLength={200} defaultValue={values.titleAr} />}
          </Field>
          <Field label={t("form.titleTr")}>
            {(p) => <TextInput {...p} name="titleTr" maxLength={200} defaultValue={values.titleTr} />}
          </Field>
          <Field label={t("common.status")} required>
            {(p) => (
              <Select {...p} name="status" defaultValue={values.status}>
                <option value="DRAFT">{t("common.draft")}</option>
                <option value="PUBLISHED">{t("common.published")}</option>
                <option value="ARCHIVED">{t("common.archived")}</option>
              </Select>
            )}
          </Field>
          <Field label={t("common.details")} required className="sm:col-span-2 lg:col-span-3">
            {(p) => <TextArea {...p} name="description" rows={3} required defaultValue={values.description} />}
          </Field>
          <Field label={t("form.targetHours")} required>
            {(p) => (
              <TextInput {...p} name="targetHours" type="number" min={1} max={300} step="0.5" required defaultValue={values.targetHours} />
            )}
          </Field>
          <Field label={t("form.entryLevel")} hint={t("form.entryLevelHint")}>
            {(p) => (
              <Select {...p} name="audienceLevel" defaultValue={values.audienceLevel}>
                <option value="">—</option>
                {LEVEL_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.targetLevel")} hint={t("form.targetLevelHint")}>
            {(p) => (
              <Select {...p} name="targetLevelId" defaultValue={values.targetLevelId}>
                <option value="">—</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="label">{t("form.jobFamilies")}</legend>
          <p className="mb-2 text-[12px] text-[var(--brand-muted)]">
            {t("form.pathFamilyHint")}
          </p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {JOB_FAMILIES.map((f) => (
              <Checkbox
                key={f}
                name="jobFamilies"
                value={f}
                defaultChecked={values.jobFamilies.includes(f)}
                label={humanizeKey(f)}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Checkbox
            name="isDefault"
            defaultChecked={values.isDefault}
            label={t("form.corporateDefault")}
            description="Only one path can hold this"
          />
          <Checkbox
            name="isTechnical"
            defaultChecked={values.isTechnical}
            label={t("form.technicalPath")}
            description="Never offered to non-technical employees"
          />
        </div>
      </Card>

      <Submit />
    </form>
  );
}
