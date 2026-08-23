"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormError, FormSuccess, RadioCard, Select, TextArea } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { AI_EXPERIENCE, LEARNING_GOALS, LOCALES } from "@/lib/constants";
import { LOCALE_LABELS } from "@/lib/i18n";
import { updateProfileAction, type ProfileState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function ProfileForm({
  defaults,
}: {
  defaults: {
    preferredLanguage: string;
    weeklyLearningHours: number;
    aiExperience: string;
    isTechnical: "yes" | "no";
    mainTasks: string;
    goals: string[];
  };
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<ProfileState, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="space-y-5">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("profile.preferredLanguage")} required>
          {(p) => (
            <Select {...p} name="preferredLanguage" defaultValue={defaults.preferredLanguage}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t("profile.weeklyAvailability")} required>
          {(p) => (
            <Select {...p} name="weeklyLearningHours" defaultValue={String(defaults.weeklyLearningHours)}>
              {[1, 2, 3, 5].map((h) => (
                <option key={h} value={h}>
                  {h} {t("common.hours")} / {t("common.week")}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label={t("onboarding.aiExperience")} required>
        {(p) => (
          <Select {...p} name="aiExperience" defaultValue={defaults.aiExperience}>
            {AI_EXPERIENCE.map((v) => (
              <option key={v} value={v}>
                {t(`aiExperience.${v}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={t("onboarding.isTechnical")} required>
        {() => (
          <div className="grid gap-2 sm:grid-cols-2">
            <RadioCard name="isTechnical" value="no" defaultChecked={defaults.isTechnical === "no"} label={t("common.no")} />
            <RadioCard name="isTechnical" value="yes" defaultChecked={defaults.isTechnical === "yes"} label={t("common.yes")} />
          </div>
        )}
      </Field>

      <Field label={t("onboarding.mainTasks")} hint={t("onboarding.mainTasksHint")}>
        {(p) => <TextArea {...p} name="mainTasks" rows={2} defaultValue={defaults.mainTasks} maxLength={600} />}
      </Field>

      <fieldset>
        <legend className="label">{t("profile.learningGoals")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEARNING_GOALS.map((g) => (
            <Checkbox
              key={g}
              name="goals"
              value={g}
              defaultChecked={defaults.goals.includes(g)}
              label={t(`goals.${g}`)}
            />
          ))}
        </div>
      </fieldset>

      <Submit />
    </form>
  );
}
