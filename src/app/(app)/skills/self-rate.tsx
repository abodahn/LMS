"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { selfRateAction, type SkillState } from "./actions";

const LEVELS = [0, 1, 2, 3, 4, 5];

/**
 * Self-rating, one skill at a time.
 *
 * Saves on change rather than behind a button, for the same reason as the
 * manager's control: nobody presses Save fifteen times down a list. The message
 * below only ever appears when a rating was refused because an observed one
 * already exists — a silent no-op would leave someone believing they had
 * changed their record when they had not.
 */
export function SelfRate({ skillId, skillName, level }: { skillId: string; skillName: string; level: number }) {
  const t = useT();
  const msg = useMessage();
  // A refused rating remounts the select on the stored level, so the screen
  // never shows a value that was not saved.
  const [state, submit] = useActionState<SkillState & { attempt: number }, FormData>(
    async (prev, form) => ({ ...(await selfRateAction(prev, form)), attempt: prev.attempt + 1 }),
    { attempt: 0 },
  );

  return (
    <form action={submit} className="flex flex-col items-end gap-1">
      <input type="hidden" name="skillId" value={skillId} />
      <Select
        key={state.error ? `${level}:${state.attempt}` : String(level)}
        name="level"
        defaultValue={String(level)}
        aria-label={`${t("skills.selfRate")}: ${skillName}`}
        className="h-8 w-[136px] text-[12px]"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l} · {t(`skills.level.${l}`)}
          </option>
        ))}
      </Select>
      {state.error ? (
        <span role="status" className="max-w-[220px] text-end text-[11px] text-[var(--brand-muted)]">
          {msg(state.error)}
        </span>
      ) : null}
    </form>
  );
}
