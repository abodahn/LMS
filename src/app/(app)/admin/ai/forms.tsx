"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { deleteBudgetAction, saveBudgetAction, saveModelsAction, type AiAdminState } from "./actions";

const ROLES = ["FAST", "REASONING", "LOW_COST", "TRANSLATION", "FALLBACK"] as const;

function Submit({ label }: { label?: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : (label ?? t("common.save"))}
    </Button>
  );
}

export function BudgetForm({ departments }: { departments: { id: string; name: string }[] }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<AiAdminState, FormData>(saveBudgetAction, {});

  return (
    <form action={action} className="mt-4 space-y-3">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t("ai.budgetScope")} required className="sm:col-span-2">
          {(p) => (
            <Select {...p} name="scope" defaultValue="COMPANY">
              <option value="COMPANY">{t("ai.wholeCompany")}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("ai.monthlyTokens")} required>
          {(p) => <TextInput {...p} name="monthlyTokens" type="number" min={1000} step={1000} required />}
        </Field>
        <Field label={t("ai.atLimit")} required>
          {(p) => (
            <Select {...p} name="hardStop" defaultValue="no">
              <option value="no">{t("ai.warnOnly")}</option>
              <option value="yes">{t("ai.hardStop")}</option>
            </Select>
          )}
        </Field>
      </div>
      <Submit />
    </form>
  );
}

export function DeleteBudget({ budgetKey }: { budgetKey: string }) {
  const t = useT();
  const [, action] = useActionState<AiAdminState, FormData>(deleteBudgetAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="key" value={budgetKey} />
      <Button type="submit" size="sm" variant="ghost">
        {t("common.remove")}
      </Button>
    </form>
  );
}

export function ModelsForm({
  models,
  prices,
  defaultModel,
}: {
  models: Partial<Record<(typeof ROLES)[number], string>>;
  prices: string;
  defaultModel: string;
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<AiAdminState, FormData>(saveModelsAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("ai.modelRoles")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("ai.modelRolesHint")}</p>
      <form action={action} className="mt-4 space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <Field key={role} label={t(`ai.role.${role}`)} hint={t(`ai.roleHint.${role}`)}>
              {(p) => (
                <TextInput
                  {...p}
                  name={`model_${role}`}
                  defaultValue={models[role] ?? ""}
                  placeholder={role === "FALLBACK" ? "—" : defaultModel}
                  maxLength={120}
                  dir="ltr"
                />
              )}
            </Field>
          ))}
        </div>
        <Field label={t("ai.prices")} hint={t("ai.pricesHint")}>
          {(p) => (
            <TextArea
              {...p}
              name="prices"
              rows={4}
              defaultValue={prices}
              dir="ltr"
              placeholder="model-name = 3 / 15"
              className="font-mono text-[12px]"
            />
          )}
        </Field>
        <Submit />
      </form>
    </Card>
  );
}
