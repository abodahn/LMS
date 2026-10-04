"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { saveChallengeAction, toggleChallengeAction, type ChallengeState } from "./actions";

const METRICS = ["POINTS", "COURSES", "LESSONS", "MINUTES", "ACTIVE_DAYS"] as const;

export type ChallengeRow = {
  id: string;
  title: string;
  titleAr: string | null;
  titleTr: string | null;
  description: string | null;
  metric: string;
  target: number | null;
  departmentId: string | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

function Submit({ label, ariaLabel }: { label?: string; ariaLabel?: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} aria-label={ariaLabel}>
      {pending ? t("common.saving") : (label ?? t("common.save"))}
    </Button>
  );
}

export function ChallengeForm({
  departments,
  current,
}: {
  departments: { id: string; name: string }[];
  current?: ChallengeRow;
}) {
  const t = useT();
  const msg = useMessage();
  // React resets a form after every action. On a refusal the fields remount
  // with what was typed, so a wrong date does not cost the whole form.
  const [state, action] = useActionState<ChallengeState & { attempt: number; values?: Record<string, string> }, FormData>(
    async (prev, form) => {
      const result = await saveChallengeAction(prev, form);
      const values = result.error
        ? Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]))
        : undefined;
      return { ...result, attempt: prev.attempt + 1, values };
    },
    { attempt: 0 },
  );
  const v = state.values;
  const val = (key: string, fallback: string | number | null | undefined) => v?.[key] ?? (fallback ?? "");

  return (
    <form action={action} className="space-y-3" key={state.error ? `retry-${state.attempt}` : "form"}>
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      {current ? <input type="hidden" name="id" value={current.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("challenges.titleEn")} required>
          {(p) => (
            <TextInput {...p} name="title" defaultValue={val("title", current?.title)} required minLength={3} maxLength={120} />
          )}
        </Field>
        <Field label={t("challenges.titleAr")}>
          {(p) => <TextInput {...p} name="titleAr" defaultValue={val("titleAr", current?.titleAr)} maxLength={120} dir="rtl" />}
        </Field>
        <Field label={t("challenges.titleTr")}>
          {(p) => <TextInput {...p} name="titleTr" defaultValue={val("titleTr", current?.titleTr)} maxLength={120} />}
        </Field>
      </div>
      <Field label={t("challenges.description")}>
        {(p) => (
          <TextArea {...p} name="description" rows={2} defaultValue={val("description", current?.description)} maxLength={500} />
        )}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("challenges.measure")} required>
          {(p) => (
            <Select {...p} name="metric" defaultValue={val("metric", current?.metric ?? "POINTS")}>
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {t(`challenges.metric.${m}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("challenges.who")} required>
          {(p) => (
            <Select {...p} name="departmentId" defaultValue={val("departmentId", current?.departmentId)}>
              <option value="">{t("challenges.allDepartments")}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("challenges.targetLabel")} hint={t("challenges.targetHint")}>
          {(p) => <TextInput {...p} name="target" type="number" min={1} defaultValue={val("target", current?.target)} />}
        </Field>
        <Field label={t("challenges.startsOn")} required>
          {(p) => <TextInput {...p} name="startsOn" type="date" defaultValue={val("startsOn", current?.startsOn)} required />}
        </Field>
        <Field label={t("challenges.endsOn")} required>
          {(p) => <TextInput {...p} name="endsOn" type="date" defaultValue={val("endsOn", current?.endsOn)} required />}
        </Field>
      </div>
      <Submit />
    </form>
  );
}

export function ToggleChallenge({ id, isActive, title }: { id: string; isActive: boolean; title: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ChallengeState, FormData>(toggleChallengeAction, {});
  const label = isActive ? t("challenges.pause") : t("challenges.resume");
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state.error ? (
        <span role="status" className="text-[12px] text-[var(--brand-red)]">
          {msg(state.error)}
        </span>
      ) : null}
      <Submit label={label} ariaLabel={`${label}: ${title}`} />
    </form>
  );
}
