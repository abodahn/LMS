"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { saveDefinitionAction, type QuestionState } from "../questions/actions";

const DIFFICULTIES = ["EASY", "MEDIUM", "ADVANCED"] as const;

export type DefinitionDraft = {
  id?: string;
  key: string;
  title: string;
  description: string;
  type: string;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  cooldownMinutes: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  isAdaptive: boolean;
  status: string;
  pools: Record<string, number>;
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

export function DefinitionForm({
  initial,
  competencies,
  available,
}: {
  initial: DefinitionDraft;
  competencies: { id: string; name: string }[];
  /** How many published questions exist per competency and difficulty. */
  available: Record<string, number>;
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<QuestionState, FormData>(saveDefinitionAction, {});
  const [pools, setPools] = useState(initial.pools);

  const total = Object.values(pools).reduce((s, v) => s + (Number(v) || 0), 0);
  const shortfall = Object.entries(pools).filter(([key, count]) => (available[key] ?? 0) < count);

  return (
    <form action={action} className="space-y-5">
      {initial.id ? <input type="hidden" name="definitionId" value={initial.id} /> : null}
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.definition")}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("form.key")} required>
            {(p) => <TextInput {...p} name="key" required maxLength={60} defaultValue={initial.key} />}
          </Field>
          <Field label={t("form.title")} required className="lg:col-span-2">
            {(p) => <TextInput {...p} name="title" required maxLength={200} defaultValue={initial.title} />}
          </Field>
          <Field label={t("form.type")} required>
            {(p) => (
              <Select {...p} name="type" defaultValue={initial.type}>
                <option value="PLACEMENT">{t("form.placement")}</option>
                <option value="TECHNICAL">{t("form.technical")}</option>
                <option value="MODULE">{t("form.moduleQuiz")}</option>
                <option value="FINAL">{t("form.final")}</option>
                <option value="RESPONSIBLE_AI">{t("form.responsibleAi")}</option>
              </Select>
            )}
          </Field>
          <Field label={t("common.status")} required>
            {(p) => (
              <Select {...p} name="status" defaultValue={initial.status}>
                <option value="DRAFT">{t("common.draft")}</option>
                <option value="PUBLISHED">{t("common.published")}</option>
                <option value="ARCHIVED">{t("common.archived")}</option>
              </Select>
            )}
          </Field>
          <Field label={t("form.durationMinutes")} required>
            {(p) => (
              <TextInput {...p} name="durationMinutes" type="number" min={1} max={600} required defaultValue={initial.durationMinutes} />
            )}
          </Field>
          <Field label={t("form.passingScore")} required>
            {(p) => (
              <TextInput {...p} name="passingScore" type="number" min={0} max={100} required defaultValue={initial.passingScore} />
            )}
          </Field>
          <Field label={t("form.attemptLimit")} required>
            {(p) => (
              <TextInput {...p} name="maxAttempts" type="number" min={1} max={20} required defaultValue={initial.maxAttempts} />
            )}
          </Field>
          <Field label={t("form.cooldownMinutes")} required hint={t("form.cooldownHint")}>
            {(p) => (
              <TextInput {...p} name="cooldownMinutes" type="number" min={0} required defaultValue={initial.cooldownMinutes} />
            )}
          </Field>
          <Field label={t("common.details")} className="sm:col-span-2 lg:col-span-3">
            {(p) => <TextArea {...p} name="description" rows={2} maxLength={2000} defaultValue={initial.description} />}
          </Field>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Checkbox name="randomizeQuestions" defaultChecked={initial.randomizeQuestions} label={t("form.randomiseQuestions")} />
          <Checkbox name="randomizeOptions" defaultChecked={initial.randomizeOptions} label={t("form.randomiseOptions")} />
          <Checkbox
            name="isAdaptive"
            defaultChecked={initial.isAdaptive}
            label={t("form.adaptive")}
            description="Three correct in a row steps difficulty up; two wrong steps it down"
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.questionPools")}</h2>
            <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
              {t("form.poolHint")}
            </p>
          </div>
          <span className="text-[13px] font-semibold text-[var(--brand-ink)]">{total} questions</span>
        </div>

        {shortfall.length > 0 ? (
          <p className="mt-3 rounded-[var(--radius-control)] bg-[#FDF3E3] px-3 py-2 text-[13px] text-[var(--brand-warning)]">
            Not enough published questions for: {shortfall.map(([k, c]) => `${k.replace(".", " / ")} (need ${c})`).join(", ")}
          </p>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="text-[var(--brand-muted)]">
                <th className="pb-2 text-start text-[11px] font-semibold uppercase tracking-wide">{t("form.competency")}</th>
                {DIFFICULTIES.map((d) => (
                  <th key={d} className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competencies.map((c) => (
                <tr key={c.id}>
                  <td className="border-t border-[var(--brand-line)] py-2 pe-3 font-medium text-[var(--brand-ink)]">
                    {c.name}
                  </td>
                  {DIFFICULTIES.map((d) => {
                    const key = `${c.id}.${d}`;
                    return (
                      <td key={d} className="border-t border-[var(--brand-line)] p-1 text-center">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          name={`pool.${c.id}.${d}`}
                          value={pools[key] ?? 0}
                          onChange={(e) => setPools((p) => ({ ...p, [key]: Number(e.target.value) }))}
                          aria-label={`${c.name} ${d}`}
                          className="field w-16 py-1 text-center"
                        />
                        <span className="mt-0.5 block text-[10.5px] text-[var(--brand-muted)]">
                          {available[key] ?? 0} available
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Submit />
    </form>
  );
}
