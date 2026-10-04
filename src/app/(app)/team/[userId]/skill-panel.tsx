"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { decideGoalAction, proposePlanAction, rateSkillAction, type TeamState } from "../actions";

const LEVELS = [0, 1, 2, 3, 4, 5];

/**
 * One rating, inline on the row it belongs to.
 *
 * Saving on change rather than behind a Save button: a manager going down a
 * list of fifteen skills will not press Save fifteen times, and a form that
 * silently loses most of what was entered is worse than no form.
 *
 * Because it saves on change, a failed save has to undo the change on screen —
 * otherwise the select shows a level that was never stored and the rating
 * looks saved. Each attempt is counted, and a failure remounts the select on
 * the stored level; the reason is shown and announced beside it.
 */
export function RateControl({
  userId,
  skillId,
  skillName,
  level,
}: {
  userId: string;
  skillId: string;
  skillName: string;
  level: number;
}) {
  const t = useT();
  const msg = useMessage();
  const [state, submit] = useActionState<TeamState & { attempt: number }, FormData>(
    async (prev, form) => ({ ...(await rateSkillAction(prev, form)), attempt: prev.attempt + 1 }),
    { attempt: 0 },
  );

  return (
    <form action={submit} className="flex items-center gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="skillId" value={skillId} />
      <Select
        key={state.error ? `${level}:${state.attempt}` : String(level)}
        name="level"
        defaultValue={String(level)}
        aria-label={`${t("skills.rate")}: ${skillName}`}
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
        <span role="status" className="max-w-[180px] text-[11px] text-[var(--brand-red)]">
          {msg(state.error)}
        </span>
      ) : null}
    </form>
  );
}

/** "0 → 3" with an arrow that points the right way in Arabic too. */
export function LevelRange({ from, to }: { from: number; to: number }) {
  const t = useT();
  return (
    <span aria-label={t("skills.levelRange", { from, to })} className="inline-flex items-center gap-1 tabular-nums">
      <span aria-hidden>{from}</span>
      <ArrowRight size={12} className="rtl:rotate-180" aria-hidden />
      <span aria-hidden>{to}</span>
    </span>
  );
}

function Submit({ label }: { label: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : label}
    </Button>
  );
}

export type PlanGoal = {
  id: string;
  skillName: string;
  fromLevel: number;
  targetLevel: number;
  targetDate: string | null;
  status: string;
  courses: { id: string; slug: string; title: string; hours: string }[];
};

export function PlanPanel({
  userId,
  goals,
  hasGaps,
}: {
  userId: string;
  goals: PlanGoal[];
  hasGaps: boolean;
}) {
  const t = useT();
  const msg = useMessage();
  const [proposeState, propose] = useActionState<TeamState, FormData>(proposePlanAction, {});
  const [decideState, decide] = useActionState<TeamState, FormData>(decideGoalAction, {});

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("skills.plan")}</h2>
        {hasGaps ? (
          <form action={propose}>
            <input type="hidden" name="userId" value={userId} />
            <Submit label={t("skills.proposePlan")} />
          </form>
        ) : null}
      </div>

      {proposeState.success ? <FormSuccess>{msg(proposeState.success)}</FormSuccess> : null}
      {proposeState.error ? <FormError>{msg(proposeState.error)}</FormError> : null}
      {decideState.success ? <FormSuccess>{msg(decideState.success)}</FormSuccess> : null}
      {decideState.error ? <FormError>{msg(decideState.error)}</FormError> : null}

      {goals.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--brand-muted)]">{t("skills.noPlan")}</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {goals.map((g) => (
            <li key={g.id} className="border-b border-[var(--brand-line)] pb-4 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-[var(--brand-ink)]">{g.skillName}</span>
                <span className="text-[12px] text-[var(--brand-muted)]">
                  <LevelRange from={g.fromLevel} to={g.targetLevel} /> · {t(`skills.${g.status.toLowerCase()}`)}
                </span>
              </div>

              {g.courses.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {g.courses.map((c) => (
                    <li key={c.id} className="text-[12px] text-[var(--brand-muted)]">
                      <a className="underline hover:text-[var(--brand-ink)]" href={`/catalog?q=${encodeURIComponent(c.title)}`}>
                        {c.title}
                      </a>{" "}
                      · {c.hours}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[12px] text-[var(--brand-muted)]">{t("skills.noCourseYet")}</p>
              )}

              {g.status === "PROPOSED" || g.status === "APPROVED" ? (
                <form action={decide} className="mt-2.5 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="goalId" value={g.id} />
                  <input type="hidden" name="userId" value={userId} />
                  <label className="text-[11px] text-[var(--brand-muted)]">
                    <span className="mb-1 block">{t("skills.targetDate")}</span>
                    <TextInput
                      type="date"
                      name="targetDate"
                      defaultValue={g.targetDate ?? ""}
                      className="h-8 w-[150px] text-[12px]"
                    />
                  </label>
                  <Button type="submit" size="sm" name="decision" value="APPROVED">
                    {t("skills.approve")}
                  </Button>
                  <Button type="submit" size="sm" variant="ghost" name="decision" value="DROPPED">
                    {t("skills.drop")}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
