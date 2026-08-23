"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { QUESTION_TYPES } from "@/lib/constants";
import { humanizeKey } from "@/lib/utils";
import { deleteQuestionAction, saveQuestionAction, type QuestionState } from "./actions";

type OptionDraft = {
  id?: string;
  text: string;
  textAr: string;
  textTr: string;
  isCorrect: boolean;
  feedback: string;
};

export type QuestionDraft = {
  id?: string;
  bankId: string;
  competencyId: string;
  type: string;
  difficulty: string;
  text: string;
  textAr: string;
  textTr: string;
  explanation: string;
  points: number;
  status: string;
  isTechnical: boolean;
  options: OptionDraft[];
};

const emptyOption = (): OptionDraft => ({ text: "", textAr: "", textTr: "", isCorrect: false, feedback: "" });

export function QuestionEditor({
  initial,
  competencies,
  banks,
}: {
  initial: QuestionDraft;
  competencies: { id: string; name: string }[];
  banks: { id: string; name: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState<QuestionState>({});
  const [pending, start] = useTransition();

  const written = draft.type === "SHORT_ANSWER" || draft.type === "PROMPT_TASK";
  const multi = draft.type === "MULTI";

  const set = <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setOption = (i: number, patch: Partial<OptionDraft>) =>
    setDraft((d) => {
      const options = d.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o));
      // Only a multi-select may have more than one correct answer.
      if (patch.isCorrect && d.type !== "MULTI") {
        return { ...d, options: options.map((o, idx) => ({ ...o, isCorrect: idx === i })) };
      }
      return { ...d, options };
    });

  const save = () =>
    start(async () => {
      setState(
        await saveQuestionAction({
          questionId: draft.id,
          bankId: draft.bankId || undefined,
          competencyId: draft.competencyId,
          type: draft.type as (typeof QUESTION_TYPES)[number],
          difficulty: draft.difficulty as "EASY" | "MEDIUM" | "ADVANCED",
          text: draft.text,
          textAr: draft.textAr,
          textTr: draft.textTr,
          explanation: draft.explanation,
          points: draft.points,
          status: draft.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          isTechnical: draft.isTechnical,
          options: written ? [] : draft.options,
        }),
      );
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("form.competency")} required>
            {(p) => (
              <Select {...p} value={draft.competencyId} onChange={(e) => set("competencyId", e.target.value)}>
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.type")} required>
            {(p) => (
              <Select {...p} value={draft.type} onChange={(e) => set("type", e.target.value)}>
                {QUESTION_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {humanizeKey(x)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.difficulty")} required>
            {(p) => (
              <Select {...p} value={draft.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                {["EASY", "MEDIUM", "ADVANCED"].map((x) => (
                  <option key={x} value={x}>
                    {humanizeKey(x)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.questionBank")}>
            {(p) => (
              <Select {...p} value={draft.bankId} onChange={(e) => set("bankId", e.target.value)}>
                <option value="">—</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.points")} required>
            {(p) => (
              <TextInput
                {...p}
                type="number"
                min={0.5}
                max={20}
                step="0.5"
                value={draft.points}
                onChange={(e) => set("points", Number(e.target.value))}
              />
            )}
          </Field>
          <Field label={t("common.status")} required>
            {(p) => (
              <Select {...p} value={draft.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DRAFT">{t("common.draft")}</option>
                <option value="PUBLISHED">{t("common.published")}</option>
                <option value="ARCHIVED">{t("common.archived")}</option>
              </Select>
            )}
          </Field>
        </div>

        <div className="mt-5 grid gap-5">
          <Field label={t("form.questionEn")} required>
            {(p) => <TextArea {...p} rows={3} value={draft.text} onChange={(e) => set("text", e.target.value)} />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("form.questionAr")}>
              {(p) => (
                <TextArea {...p} rows={2} dir="rtl" value={draft.textAr} onChange={(e) => set("textAr", e.target.value)} />
              )}
            </Field>
            <Field label={t("form.questionTr")}>
              {(p) => <TextArea {...p} rows={2} value={draft.textTr} onChange={(e) => set("textTr", e.target.value)} />}
            </Field>
          </div>
          <Field label={t("assessment.explanation")} hint={t("form.explanationHint")}>
            {(p) => (
              <TextArea {...p} rows={2} value={draft.explanation} onChange={(e) => set("explanation", e.target.value)} />
            )}
          </Field>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={draft.isTechnical}
            onChange={(e) => set("isTechnical", e.target.checked)}
            className="h-4 w-4 accent-[var(--brand-red)]"
          />
          {t("form.technicalQuestionLabel")}
        </label>
      </Card>

      {!written ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.options")}</h2>
              <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                {multi ? "Multi-select: mark every correct option." : "Exactly one option must be correct."}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setDraft((d) => ({ ...d, options: [...d.options, emptyOption()] }))}>
              <Plus size={15} />
              {t("common.add")}
            </Button>
          </div>

          <ul className="mt-4 space-y-3">
            {draft.options.map((o, i) => (
              <li key={i} className="rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3">
                <div className="flex items-center gap-3">
                  <label className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium">
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name="correct"
                      checked={o.isCorrect}
                      onChange={(e) => setOption(i, { isCorrect: e.target.checked })}
                      className="h-4 w-4 accent-[var(--brand-red)]"
                    />
                    Correct
                  </label>
                  <input
                    value={o.text}
                    onChange={(e) => setOption(i, { text: e.target.value })}
                    placeholder={t("form.optionTextEn")}
                    aria-label={`Option ${i + 1}`}
                    className="field flex-1"
                  />
                  <button
                    type="button"
                    aria-label={t("form.removeOption")}
                    onClick={() => setDraft((d) => ({ ...d, options: d.options.filter((_, x) => x !== i) }))}
                    className="rounded-[var(--radius-control)] p-1.5 text-[var(--brand-muted)] hover:bg-[var(--brand-red-soft)] hover:text-[var(--brand-red)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <input
                    value={o.textAr}
                    onChange={(e) => setOption(i, { textAr: e.target.value })}
                    placeholder="AR"
                    dir="rtl"
                    aria-label={`Option ${i + 1} Arabic`}
                    className="field text-[13px]"
                  />
                  <input
                    value={o.textTr}
                    onChange={(e) => setOption(i, { textTr: e.target.value })}
                    placeholder="TR"
                    aria-label={`Option ${i + 1} Turkish`}
                    className="field text-[13px]"
                  />
                  <input
                    value={o.feedback}
                    onChange={(e) => setOption(i, { feedback: e.target.value })}
                    placeholder={t("form.feedback")}
                    aria-label={`Option ${i + 1} feedback`}
                    className="field text-[13px]"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.writtenAnswer")}</h2>
          <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
            {t("form.promptRubricHint")}
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? t("common.saving") : t("common.save")}
        </Button>
        {draft.id ? (
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => start(() => deleteQuestionAction(draft.id!))}
          >
            <Trash2 size={15} />
            {t("common.delete")}
          </Button>
        ) : null}
        <p className="text-[12px] text-[var(--brand-muted)]">
          {t("form.questionArchiveHint")}
        </p>
      </div>
    </div>
  );
}
