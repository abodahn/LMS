"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { draftCourseAction, draftQuizAction, summarizeAction, translateAction, type AiState } from "./ai-actions";

function Submit({ label, busyLabel }: { label: string; busyLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Sparkles size={15} aria-hidden />
      {pending ? busyLabel : label}
    </Button>
  );
}

/** The brief for a new course. The draft opens in the editor as soon as it exists. */
export function CourseBuilderForm() {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<AiState, FormData>(draftCourseAction, {});

  return (
    <Card className="p-5">
      <form action={action} className="space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <Field label={t("ai.topic")} required hint={t("ai.topicHint")}>
          {(p) => <TextInput {...p} name="topic" required minLength={3} maxLength={300} />}
        </Field>
        <Field label={t("ai.audience")} required hint={t("ai.audienceHint")}>
          {(p) => <TextArea {...p} name="audience" required minLength={3} maxLength={300} rows={2} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("common.language")} required>
            {(p) => (
              <Select {...p} name="language" defaultValue="en">
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
              </Select>
            )}
          </Field>
          <Field label={t("ai.hours")} required>
            {(p) => <TextInput {...p} name="hours" type="number" min={0.25} max={4} step={0.25} defaultValue={1} required />}
          </Field>
        </div>
        <p className="text-[12px] text-[var(--brand-muted)]">{t("ai.draftNotice")}</p>
        <Submit label={t("ai.draftCourse")} busyLabel={t("ai.drafting")} />
      </form>
    </Card>
  );
}

/**
 * Summarise and translate, inside the course form.
 *
 * Both write into the form's own fields and stop there. The administrator reads
 * the result, edits it if it needs editing, and saves it with the rest of the
 * course — the AI never writes to the database from here.
 */
export function AiAssist() {
  const t = useT();
  const msg = useMessage();
  const anchor = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const field = (name: string) =>
    anchor.current?.closest("form")?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
  const read = (name: string) => field(name)?.value?.trim() ?? "";
  const write = (name: string, value: string) => {
    const el = field(name);
    if (!el) return;
    el.value = value;
    // Marked, so a reviewer can see at a glance which fields a machine filled.
    el.dataset.aiFilled = "true";
  };

  const summarize = () =>
    start(async () => {
      setError(null);
      setDone(null);
      const text = [read("description"), read("outcomes")].filter(Boolean).join("\n");
      const lang = read("language");
      const res = await summarizeAction({
        title: read("title"),
        text,
        language: lang === "ar" || lang === "tr" ? lang : "en",
      });
      if ("error" in res && res.error) return setError(res.error);
      if ("text" in res && res.text) {
        write("description", res.text);
        setDone("ai.filledReview");
      }
    });

  const translate = (to: "ar" | "tr") =>
    start(async () => {
      setError(null);
      setDone(null);
      const res = await translateAction({
        title: read("title"),
        description: read("description"),
        outcomes: read("outcomes").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8),
        to,
      });
      if ("error" in res && res.error) return setError(res.error);
      if ("translation" in res && res.translation) {
        const suffix = to === "ar" ? "Ar" : "Tr";
        write(`title${suffix}`, res.translation.title);
        write(`description${suffix}`, res.translation.description);
        setDone("ai.filledReview");
      }
    });

  return (
    <div ref={anchor} className="rounded-[var(--radius-control)] border border-dashed border-[var(--brand-line)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={summarize}>
          <Sparkles size={14} aria-hidden />
          {t("ai.writeDescription")}
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => translate("ar")}>
          <Languages size={14} aria-hidden />
          {t("ai.translateAr")}
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => translate("tr")}>
          <Languages size={14} aria-hidden />
          {t("ai.translateTr")}
        </Button>
        {pending ? <span className="text-[12px] text-[var(--brand-muted)]">{t("ai.working")}</span> : null}
      </div>
      <div role="status" className="mt-2 text-[12px]">
        {error ? <span className="text-[var(--brand-red)]">{msg(error)}</span> : null}
        {done ? <span className="text-[var(--brand-muted)]">{msg(done)}</span> : null}
      </div>
    </div>
  );
}

/** Draft questions from this course's own lesson text, into a bank of drafts. */
export function QuizDraftForm({ courseId }: { courseId: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<AiState, FormData>(draftQuizAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("ai.quizTitle")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("ai.quizHint")}</p>
      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="courseId" value={courseId} />
        <Field label={t("ai.questionCount")}>
          {(p) => <TextInput {...p} name="count" type="number" min={1} max={20} defaultValue={5} className="w-28" />}
        </Field>
        <Submit label={t("ai.draftQuestions")} busyLabel={t("ai.drafting")} />
      </form>
      <div className="mt-3 space-y-2">
        <FormError>{msg(state.error)}</FormError>
        {state.success ? (
          <FormSuccess>
            {msg(state.success)}{" "}
            <Link href="/admin/questions" className="underline underline-offset-2">
              {t("ai.reviewQuestions")}
            </Link>
          </FormSuccess>
        ) : null}
      </div>
    </Card>
  );
}
