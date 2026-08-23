"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextArea } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { verifyCourseAction, type CourseState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? t("common.saving") : t("common.confirm")}
    </Button>
  );
}

export function VerificationForm({ courseId }: { courseId: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<CourseState, FormData>(verifyCourseAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.courseReview")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
        {t("form.verificationHint")}
      </p>

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="courseId" value={courseId} />
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("form.linkWorking")} required>
            {(p) => (
              <Select {...p} name="linkWorking" defaultValue="yes">
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </Select>
            )}
          </Field>
          <Field label={t("form.stillAvailable")} required>
            {(p) => (
              <Select {...p} name="stillAvailable" defaultValue="yes">
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </Select>
            )}
          </Field>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Checkbox name="durationUpdated" label={t("form.durationUpdated")} />
          <Checkbox name="priceUpdated" label={t("form.priceUpdated")} />
          <Checkbox name="ratingUpdated" label={t("form.ratingUpdated")} />
          <Checkbox name="archive" label={t("common.archived")} description="Removes it from recommendations" />
        </div>

        <Field label={t("form.notes")}>{(p) => <TextArea {...p} name="notes" rows={2} maxLength={1000} />}</Field>

        <Submit />
      </form>
    </Card>
  );
}
