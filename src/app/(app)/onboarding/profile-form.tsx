"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProfileStep, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, RadioCard, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { AI_EXPERIENCE } from "@/lib/constants";

const WEEKLY_OPTIONS = [1, 2, 3, 5];

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? t("common.saving") : t("onboarding.saveAndContinue")}
    </Button>
  );
}

export function ProfileStepForm({
  defaults,
}: {
  defaults: {
    yearsExperience: number;
    aiExperience: string;
    isTechnical: "yes" | "no";
    weeklyLearningHours: number;
    mainTasks: string;
  };
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OnboardingState, FormData>(saveProfileStep, {});

  return (
    <form action={action} className="space-y-5">
      <FormError>{msg(state.error)}</FormError>

      <Field label={t("onboarding.aiExperience")} required>
        {() => (
          <div className="grid gap-2">
            {AI_EXPERIENCE.map((v) => (
              <RadioCard
                key={v}
                name="aiExperience"
                value={v}
                defaultChecked={defaults.aiExperience === v}
                label={t(`aiExperience.${v}`)}
                required
              />
            ))}
          </div>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("onboarding.yearsExperience")} required>
          {(p) => (
            <TextInput
              {...p}
              name="yearsExperience"
              type="number"
              min={0}
              max={60}
              defaultValue={defaults.yearsExperience}
              required
            />
          )}
        </Field>

        <Field label={t("onboarding.weeklyHours")} required>
          {(p) => (
            <Select {...p} name="weeklyLearningHours" defaultValue={String(defaults.weeklyLearningHours)} required>
              {WEEKLY_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} {t("common.hours")} / {t("common.week")}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label={t("onboarding.isTechnical")} required>
        {() => (
          <div className="grid gap-2 sm:grid-cols-2">
            <RadioCard name="isTechnical" value="no" defaultChecked={defaults.isTechnical === "no"} label={t("common.no")} required />
            <RadioCard name="isTechnical" value="yes" defaultChecked={defaults.isTechnical === "yes"} label={t("common.yes")} />
          </div>
        )}
      </Field>

      <Field label={t("onboarding.mainTasks")} hint={t("onboarding.mainTasksHint")}>
        {(p) => <TextArea {...p} name="mainTasks" defaultValue={defaults.mainTasks} rows={3} maxLength={600} />}
      </Field>

      <Submit />
    </form>
  );
}
