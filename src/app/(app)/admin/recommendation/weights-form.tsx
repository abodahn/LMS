"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { saveWeightsAction, type EngineState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function WeightsForm({
  weights,
  targets,
}: {
  weights: { key: string; label: string; weight: number; description: string | null }[];
  targets: { target: number; min: number; max: number };
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<EngineState, FormData>(saveWeightsAction, {});
  const [values, setValues] = useState(() => Object.fromEntries(weights.map((w) => [w.key, w.weight])));
  const total = Object.values(values).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <form action={action} className="space-y-5">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {weights.map((w) => (
          <Field key={w.key} label={w.label} hint={w.description ?? undefined}>
            {(p) => (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={values[w.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [w.key]: Number(e.target.value) }))}
                  className="flex-1 accent-[var(--brand-red)]"
                  aria-label={w.label}
                />
                <input
                  {...p}
                  name={`weight.${w.key}`}
                  type="number"
                  min={0}
                  max={100}
                  value={values[w.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [w.key]: Number(e.target.value) }))}
                  className="field w-20 text-center tabular-nums"
                />
              </div>
            )}
          </Field>
        ))}
      </div>

      <p className="text-[13px] text-[var(--brand-muted)]">
        {t("common.total")}: <span className="font-semibold text-[var(--brand-ink)]">{total}</span> —{" "}
        {t("admin.weightsHelp")}
      </p>

      <div className="grid gap-4 border-t border-[var(--brand-line)] pt-4 sm:grid-cols-3">
        <Field label={`${t("admin.totalHours")} (min)`}>
          {(p) => <TextInput {...p} name="minHours" type="number" min={1} max={200} defaultValue={targets.min} />}
        </Field>
        <Field label={`${t("admin.totalHours")} (target)`}>
          {(p) => <TextInput {...p} name="targetHours" type="number" min={1} max={200} defaultValue={targets.target} />}
        </Field>
        <Field label={`${t("admin.totalHours")} (max)`}>
          {(p) => <TextInput {...p} name="maxHours" type="number" min={1} max={300} defaultValue={targets.max} />}
        </Field>
      </div>

      <Submit />
    </form>
  );
}
