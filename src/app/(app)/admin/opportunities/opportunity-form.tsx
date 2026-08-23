"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { updateOpportunityAction, type ContentState } from "../content/actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function OpportunityForm({
  opportunity,
}: {
  opportunity: {
    id: string;
    status: string;
    impact: string;
    complexity: string;
    hoursBefore: number | null;
    hoursAfter: number | null;
    hoursSavedMonthly: number | null;
    financialBenefit: number | null;
    qualityImprovement: string;
  };
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ContentState, FormData>(updateOpportunityAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="opportunityId" value={opportunity.id} />
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Field label={t("common.status")} required>
          {(p) => (
            <Select {...p} name="status" defaultValue={opportunity.status}>
              {["IDENTIFIED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS", "DELIVERED", "REJECTED"].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("form.impact")} required>
          {(p) => (
            <Select {...p} name="impact" defaultValue={opportunity.impact}>
              <option value="LOW">{t("form.low")}</option>
              <option value="MEDIUM">{t("form.medium")}</option>
              <option value="HIGH">{t("form.high")}</option>
            </Select>
          )}
        </Field>
        <Field label={t("form.complexity")} required>
          {(p) => (
            <Select {...p} name="complexity" defaultValue={opportunity.complexity}>
              <option value="LOW">{t("form.low")}</option>
              <option value="MEDIUM">{t("form.medium")}</option>
              <option value="HIGH">{t("form.high")}</option>
            </Select>
          )}
        </Field>
        <Field label={t("form.hoursBefore")} hint={t("form.perMonth")}>
          {(p) => (
            <TextInput {...p} name="hoursBefore" type="number" min={0} step="0.5" defaultValue={opportunity.hoursBefore ?? ""} />
          )}
        </Field>
        <Field label={t("form.hoursAfter")} hint={t("form.perMonth")}>
          {(p) => (
            <TextInput {...p} name="hoursAfter" type="number" min={0} step="0.5" defaultValue={opportunity.hoursAfter ?? ""} />
          )}
        </Field>
        <Field label={t("form.hoursSavedMonth")} hint={t("form.annualDerived")}>
          {(p) => (
            <TextInput
              {...p}
              name="hoursSavedMonthly"
              type="number"
              min={0}
              step="0.5"
              defaultValue={opportunity.hoursSavedMonthly ?? ""}
            />
          )}
        </Field>
        <Field label={t("form.financialBenefit")} hint={t("form.measuredOnly")}>
          {(p) => (
            <TextInput
              {...p}
              name="financialBenefit"
              type="number"
              min={0}
              step="1"
              defaultValue={opportunity.financialBenefit ?? ""}
            />
          )}
        </Field>
        <Field label={t("form.qualityImprovement")}>
          {(p) => (
            <TextInput {...p} name="qualityImprovement" maxLength={500} defaultValue={opportunity.qualityImprovement} />
          )}
        </Field>
      </div>

      <Submit />
    </form>
  );
}
