"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CloudCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Progress } from "@/components/ui/primitives";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { AttemptQuestionView } from "@/lib/assessment/service";
import { saveAnswerAction, submitAssessmentAction } from "../../assessments/actions";

type Answers = Record<string, { selectedOptionIds: string[]; textAnswer: string | null }>;

export function AssessmentRunner({
  attemptId,
  title,
  questions,
  startIndex,
  deadline,
  elapsedSeconds,
}: {
  attemptId: string;
  title: string;
  questions: AttemptQuestionView[];
  startIndex: number;
  deadline: string | null;
  elapsedSeconds: number;
}) {
  const t = useT();
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<Answers>(() =>
    Object.fromEntries(
      questions.map((q) => [q.questionId, { selectedOptionIds: q.selectedOptionIds, textAnswer: q.textAnswer }]),
    ),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviewing, setReviewing] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const startedAt = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    startedAt.current ||= Date.now() - elapsedSeconds * 1000;
  }, [elapsedSeconds]);

  const current = questions[index];
  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers[q.questionId];
        return (a?.selectedOptionIds.length ?? 0) > 0 || !!a?.textAnswer?.trim();
      }).length,
    [answers, questions],
  );

  const persist = useCallback(
    (questionId: string, next: { selectedOptionIds: string[]; textAnswer: string | null }, nextIndex: number) => {
      setSaveState("saving");
      void saveAnswerAction({
        attemptId,
        questionId,
        selectedOptionIds: next.selectedOptionIds,
        textAnswer: next.textAnswer,
        currentIndex: nextIndex,
        elapsedSeconds: startedAt.current
          ? Math.round((Date.now() - startedAt.current) / 1000)
          : elapsedSeconds,
      }).then((res) => setSaveState(res.ok ? "saved" : "error"));
    },
    [attemptId, elapsedSeconds],
  );

  // Autosave: options immediately, free text after a short pause.
  const update = useCallback(
    (questionId: string, next: { selectedOptionIds: string[]; textAnswer: string | null }, debounce = 0) => {
      setAnswers((prev) => ({ ...prev, [questionId]: next }));
      clearTimeout(timers.current[questionId]);
      if (debounce === 0) {
        persist(questionId, next, index);
      } else {
        timers.current[questionId] = setTimeout(() => persist(questionId, next, index), debounce);
      }
    },
    [index, persist],
  );

  useEffect(() => {
    const copy = timers.current;
    return () => {
      for (const id of Object.keys(copy)) clearTimeout(copy[id]);
    };
  }, []);

  // Countdown. Time is informational — nothing is discarded when it runs out.
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const progress = ((index + 1) / questions.length) * 100;

  if (reviewing) {
    return (
      <ReviewPanel
        questions={questions}
        answers={answers}
        answeredCount={answeredCount}
        submitting={submitting}
        onBack={() => setReviewing(false)}
        onJump={(i) => {
          setIndex(i);
          setReviewing(false);
        }}
        onSubmit={() => startSubmit(() => submitAssessmentAction(attemptId))}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-[var(--brand-ink)]">{title}</h1>
          <div className="flex items-center gap-4 text-[13px] text-[var(--brand-muted)]">
            <SaveIndicator state={saveState} />
            {remaining !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 tabular-nums",
                  remaining < 120 && "font-semibold text-[var(--brand-red)]",
                )}
              >
                <Clock size={14} aria-hidden />
                <span className="sr-only">{t("assessment.timeRemaining")}: </span>
                {formatClock(remaining)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progress} label={`${index + 1} / ${questions.length}`} />
          <p className="mt-2 text-[13px] text-[var(--brand-muted)]">
            {t("assessment.questionOf", { current: index + 1, total: questions.length })}
          </p>
        </div>
      </header>

      <section className="card p-5 sm:p-6">
        <p className="section-title">{current.competencyName}</p>
        <h2 className="mt-2 text-[17px] font-semibold leading-relaxed text-[var(--brand-ink)]">{current.text}</h2>
        <p className="mt-1.5 text-[13px] text-[var(--brand-muted)]">
          {current.type === "MULTI"
            ? t("assessment.selectMultiple")
            : current.type === "SHORT_ANSWER" || current.type === "PROMPT_TASK"
              ? t("assessment.writeAnswer")
              : t("assessment.selectOne")}
        </p>

        <div className="mt-4">
          {current.type === "SHORT_ANSWER" || current.type === "PROMPT_TASK" ? (
            <div>
              <label className="sr-only" htmlFor="written-answer">
                {t("assessment.writeAnswer")}
              </label>
              <textarea
                id="written-answer"
                className="field min-h-48 resize-y font-[inherit] leading-relaxed"
                value={answers[current.questionId]?.textAnswer ?? ""}
                placeholder={t("assessment.promptTaskHint")}
                onChange={(e) =>
                  update(current.questionId, { selectedOptionIds: [], textAnswer: e.target.value }, 900)
                }
              />
              {current.rubric ? (
                <div className="mt-3 rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-3">
                  <p className="section-title">{t("assessment.detailedScores")}</p>
                  <ul className="mt-1.5 grid gap-1 text-[13px] text-[var(--brand-charcoal)] sm:grid-cols-2">
                    {current.rubric.map((c) => (
                      <li key={c.key}>
                        <span className="font-medium">{c.label}</span>
                        {c.description ? (
                          <span className="text-[var(--brand-muted)]"> — {c.description}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <ul className="grid gap-2">
              {current.options.map((o) => {
                const selected = answers[current.questionId]?.selectedOptionIds.includes(o.id) ?? false;
                const multi = current.type === "MULTI";
                return (
                  <li key={o.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border p-3.5 transition-colors",
                        selected
                          ? "border-[var(--brand-red)] bg-[var(--brand-red-soft)]"
                          : "border-[var(--brand-line)] hover:border-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]",
                      )}
                    >
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name={`q-${current.questionId}`}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]"
                        checked={selected}
                        onChange={(e) => {
                          const prev = answers[current.questionId]?.selectedOptionIds ?? [];
                          const next = multi
                            ? e.target.checked
                              ? [...prev, o.id]
                              : prev.filter((id) => id !== o.id)
                            : [o.id];
                          update(current.questionId, { selectedOptionIds: next, textAnswer: null });
                        }}
                      />
                      <span className="text-[15px] leading-relaxed text-[var(--brand-ink)]">{o.text}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <nav className="mt-5 flex items-center justify-between gap-3" aria-label={t("common.page")}>
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t("common.previous")}
        </Button>

        {index === questions.length - 1 ? (
          <Button onClick={() => setReviewing(true)}>{t("assessment.reviewAnswers")}</Button>
        ) : (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            {t("common.next")}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Button>
        )}
      </nav>

      <p className="mt-4 text-center text-[12px] text-[var(--brand-muted)]">{t("assessment.autosaved")}</p>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const t = useT();
  if (state === "idle") return null;
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--brand-red)]">
        <AlertCircle size={14} aria-hidden />
        {t("errors.saveProgress")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5" aria-live="polite">
      <CloudCheck size={14} aria-hidden />
      {state === "saving" ? t("common.saving") : t("common.saved")}
    </span>
  );
}

function ReviewPanel({
  questions,
  answers,
  answeredCount,
  submitting,
  onBack,
  onJump,
  onSubmit,
}: {
  questions: AttemptQuestionView[];
  answers: Answers;
  answeredCount: number;
  submitting: boolean;
  onBack: () => void;
  onJump: (index: number) => void;
  onSubmit: () => void;
}) {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-[var(--brand-ink)]">{t("assessment.submitConfirmTitle")}</h1>
      <p className="mt-1.5 text-sm text-[var(--brand-muted)]">
        {t("assessment.submitConfirmBody", { answered: answeredCount, total: questions.length })}
      </p>

      {answeredCount < questions.length ? (
        <div className="mt-4">
          <Alert tone="warning" icon={<AlertCircle size={16} />} title={t("assessment.unanswered")}>
            {questions.length - answeredCount}
          </Alert>
        </div>
      ) : null}

      <ol className="mt-5 grid gap-2 sm:grid-cols-2">
        {questions.map((q, i) => {
          const a = answers[q.questionId];
          const answered = (a?.selectedOptionIds.length ?? 0) > 0 || !!a?.textAnswer?.trim();
          return (
            <li key={q.questionId}>
              <button
                type="button"
                onClick={() => onJump(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius-control)] border p-3 text-start text-[13px] transition-colors",
                  answered
                    ? "border-[var(--brand-line)] bg-white hover:bg-[var(--brand-canvas)]"
                    : "border-[color-mix(in_srgb,var(--brand-warning)_45%,transparent)] bg-[#FDF3E3]",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    answered ? "bg-[var(--brand-success)] text-white" : "bg-[var(--brand-warning)] text-white",
                  )}
                >
                  {answered ? <Check size={12} aria-hidden /> : i + 1}
                </span>
                <span className="line-clamp-2 text-[var(--brand-ink)]">{q.text}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          {t("common.back")}
        </Button>
        <Button size="lg" onClick={onSubmit} disabled={submitting}>
          {submitting ? t("common.saving") : t("assessment.submitAssessment")}
        </Button>
      </div>
    </div>
  );
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
