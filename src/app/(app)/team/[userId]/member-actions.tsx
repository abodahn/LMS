"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { CoursePicker } from "@/components/course-picker";
import { nominateCourseAction, setDevelopmentGoalsAction, type TeamState } from "../actions";

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
  currentGoals,
  enrolledCourseIds,
}: {
  userId: string;
  currentGoals: string;
  enrolledCourseIds: string[];
}) {
  const t = useT();
  const msg = useMessage();
  const [nominateState, nominate] = useActionState<TeamState, FormData>(nominateCourseAction, {});
  const [goalsState, saveGoals] = useActionState<TeamState, FormData>(setDevelopmentGoalsAction, {});

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
              <CoursePicker
                id={p.id}
                aria-describedby={p["aria-describedby"]}
                name="courseId"
                required
                exclude={enrolledCourseIds}
              />
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
