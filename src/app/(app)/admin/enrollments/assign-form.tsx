"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { assignLearningAction, type EnrollmentState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.apply")}
    </Button>
  );
}

export function AssignForm({
  courses,
  departments,
  jobFamilies,
}: {
  courses: { id: string; label: string }[];
  departments: { id: string; name: string }[];
  jobFamilies: { value: string; label: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<EnrollmentState, FormData>(assignLearningAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("manager.nominate")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
        {t("form.bulkAssignHint")}
      </p>

      <form action={action} className="mt-4 space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{state.success}</FormSuccess>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("common.course")} required className="lg:col-span-2">
            {(p) => (
              <Select {...p} name="courseId" required defaultValue="">
                <option value="" disabled>
                  —
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t("common.department")}>
            {(p) => (
              <Select {...p} name="departmentId" defaultValue="">
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t("form.jobFamily")}>
            {(p) => (
              <Select {...p} name="jobFamily" defaultValue="">
                <option value="">—</option>
                {jobFamilies.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

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
