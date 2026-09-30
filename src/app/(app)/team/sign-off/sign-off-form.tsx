"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, Select, TextArea } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { signOffAction, type TeamState } from "../actions";

const LEVELS = [0, 1, 2, 3, 4, 5];

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : t("signOff.confirm")}
    </Button>
  );
}

/**
 * One sign-off.
 *
 * The skill is optional and the level only appears once a skill is chosen,
 * because recording "level 3" against nothing is worse than recording nothing.
 * Where a skill is chosen, this becomes an observed rating — the strongest
 * evidence the system holds about what somebody can actually do.
 */
export function SignOffForm({
  enrollmentId,
  skills,
}: {
  enrollmentId: string;
  skills: { id: string; name: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<TeamState, FormData>(signOffAction, {});
  const [skillId, setSkillId] = useState("");

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <Field label={t("signOff.observation")} required hint={t("signOff.observationHint")}>
        {(p) => <TextArea {...p} name="observation" required minLength={10} maxLength={1000} rows={2} />}
      </Field>

      {skills.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("signOff.skillDemonstrated")}>
            {(p) => (
              <Select {...p} name="skillId" value={skillId} onChange={(e) => setSkillId(e.currentTarget.value)}>
                <option value="">—</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {skillId ? (
            <Field label={t("skills.rate")} required>
              {(p) => (
                <Select {...p} name="skillLevel" defaultValue="3">
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l} · {t(`skills.level.${l}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : null}
        </div>
      ) : null}

      <Submit />
    </form>
  );
}
