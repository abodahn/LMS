"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { CoursePicker } from "@/components/course-picker";
import { assignLearningAction, createRecurringAction, type EnrollmentState } from "./actions";

function Submit({ label }: { label?: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : (label ?? t("common.apply"))}
    </Button>
  );
}

export type AudienceOptions = {
  departments: { id: string; name: string }[];
  jobFamilies: { value: string; label: string }[];
  jobTitles: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  shifts: string[];
};

/**
 * Who to assign to.
 *
 * One audience at a time rather than a set of independent filters. The old form
 * offered department and job family side by side, which read as "and" and
 * behaved as "either" — and an assignment that reaches the wrong two hundred
 * people is not something anybody notices until they complain.
 */
function AudiencePicker({ options }: { options: AudienceOptions }) {
  const t = useT();
  const [audience, setAudience] = useState("DEPARTMENT");

  const values: { value: string; label: string }[] =
    audience === "DEPARTMENT"
      ? options.departments.map((d) => ({ value: d.id, label: d.name }))
      : audience === "JOB_FAMILY"
        ? options.jobFamilies
        : audience === "JOB_TITLE"
          ? options.jobTitles.map((j) => ({ value: j.id, label: j.name }))
          : audience === "LOCATION"
            ? options.locations.map((l) => ({ value: l.id, label: l.name }))
            : audience === "SHIFT"
              ? options.shifts.map((s) => ({ value: s, label: s }))
              : [];

  return (
    <>
      <Field label={t("form.assignTo")} required>
        {(p) => (
          <Select {...p} name="audience" value={audience} onChange={(e) => setAudience(e.currentTarget.value)}>
            <option value="EVERYONE">{t("form.audienceEveryone")}</option>
            <option value="DEPARTMENT">{t("common.department")}</option>
            <option value="JOB_FAMILY">{t("form.jobFamily")}</option>
            <option value="JOB_TITLE">{t("form.jobTitle")}</option>
            <option value="LOCATION">{t("form.location")}</option>
            <option value="SHIFT">{t("form.shift")}</option>
          </Select>
        )}
      </Field>

      <Field label={t("form.audienceValue")} required={audience !== "EVERYONE"}>
        {(p) =>
          audience === "EVERYONE" ? (
            <Select {...p} name="audienceValue" disabled defaultValue="">
              <option value="">{t("form.audienceEveryone")}</option>
            </Select>
          ) : (
            // Remounted per audience: one uncontrolled select reused across types
            // would silently keep whichever option the browser picked when the
            // chosen one vanished, and the empty placeholder would stop forcing
            // a choice.
            <Select key={audience} {...p} name="audienceValue" required defaultValue="">
              <option value="" disabled>
                —
              </option>
              {values.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </Select>
          )
        }
      </Field>
    </>
  );
}

function CourseField() {
  const t = useT();
  return (
    <Field label={t("common.course")} required className="lg:col-span-2">
      {(p) => <CoursePicker id={p.id} aria-describedby={p["aria-describedby"]} name="courseId" required />}
    </Field>
  );
}

export function AssignForm({ options }: { options: AudienceOptions }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<EnrollmentState, FormData>(assignLearningAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("manager.nominate")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("form.bulkAssignHint")}</p>

      <form action={action} className="mt-4 space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CourseField />
          <AudiencePicker options={options} />

          <Field label={`${t("learning.expectedCompletion")} (${t("common.days")})`} required>
            {(p) => <TextInput {...p} name="dueDays" type="number" min={1} max={365} required defaultValue={30} />}
          </Field>

          <Field label={t("form.type")} required>
            {(p) => (
              <Select {...p} name="source" defaultValue="ASSIGNED">
                <option value="ASSIGNED">{t("form.assigned")}</option>
                <option value="MANDATORY">{t("form.mandatory")}</option>
              </Select>
            )}
          </Field>
        </div>

        <Submit />
      </form>
    </Card>
  );
}

/**
 * Training that has to be done again.
 *
 * Saved as a rule rather than run now: the scheduler assigns it the first time
 * and every time after, so there is no first run that behaves differently from
 * the rest and nothing to remember to press again next year.
 */
export function RecurringForm({ options }: { options: AudienceOptions }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<EnrollmentState, FormData>(createRecurringAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.recurringTitle")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("form.recurringHint")}</p>

      <form action={action} className="mt-4 space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CourseField />
          <AudiencePicker options={options} />

          <Field label={t("form.everyMonths")} required>
            {(p) => <TextInput {...p} name="everyMonths" type="number" min={1} max={60} required defaultValue={12} />}
          </Field>

          <Field label={`${t("learning.expectedCompletion")} (${t("common.days")})`} required>
            {(p) => <TextInput {...p} name="dueDays" type="number" min={1} max={365} required defaultValue={30} />}
          </Field>

          <Field label={t("form.type")} required>
            {(p) => (
              <Select {...p} name="source" defaultValue="MANDATORY">
                <option value="MANDATORY">{t("form.mandatory")}</option>
                <option value="ASSIGNED">{t("form.assigned")}</option>
              </Select>
            )}
          </Field>
        </div>

        <Submit label={t("common.save")} />
      </form>
    </Card>
  );
}
