"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { nominateCourseAction, setDevelopmentGoalsAction, type TeamState } from "../actions";
import { formatHours } from "@/lib/utils";

function Submit({ label }: { label: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : label}
    </Button>
  );
}

export function MemberActions({
  userId,
  courses,
  currentGoals,
  enrolledCourseIds,
}: {
  userId: string;
  courses: { id: string; title: string; hours: number }[];
  currentGoals: string;
  enrolledCourseIds: string[];
}) {
  const t = useT();
  const msg = useMessage();
  const [nominateState, nominate] = useActionState<TeamState, FormData>(nominateCourseAction, {});
  const [goalsState, saveGoals] = useActionState<TeamState, FormData>(setDevelopmentGoalsAction, {});
  const available = courses.filter((c) => !enrolledCourseIds.includes(c.id));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("manager.recommendCourse")}</h2>
        <form action={nominate} className="mt-4 space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <FormError>{msg(nominateState.error)}</FormError>
          <FormSuccess>{msg(nominateState.success)}</FormSuccess>

          <Field label={t("common.course")} required>
            {(p) => (
              <Select {...p} name="courseId" required defaultValue="">
                <option value="" disabled>
                  {t("admin.selectEmployee")}
                </option>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatHours(c.hours)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t("learning.expectedCompletion")} hint={t("common.days")}>
            {(p) => <TextInput {...p} name="dueDays" type="number" min={7} max={365} defaultValue={30} />}
          </Field>

          <Submit label={t("manager.nominate")} />
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("manager.developmentGoals")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("manager.setGoals")}</p>
        <form action={saveGoals} className="mt-4 space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <FormError>{msg(goalsState.error)}</FormError>
          <FormSuccess>{msg(goalsState.success)}</FormSuccess>

          <Field label={t("manager.developmentGoals")}>
            {(p) => <TextArea {...p} name="goals" rows={4} maxLength={2000} defaultValue={currentGoals} />}
          </Field>

          <Submit label={t("common.save")} />
        </form>
      </Card>
    </div>
  );
}
