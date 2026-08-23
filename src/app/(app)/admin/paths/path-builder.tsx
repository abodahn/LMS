"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { FormError, FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { formatHours } from "@/lib/utils";
import { savePathStructureAction, type PathState } from "./actions";

type PathCourse = { courseId: string; isRequired: boolean; sequenceLock: boolean; minScore: number | null };
type Phase = { id?: string; title: string; description: string; courses: PathCourse[] };

export function PathBuilder({
  pathId,
  initial,
  courses,
  targetHours,
}: {
  pathId: string;
  initial: Phase[];
  courses: { id: string; title: string; hours: number }[];
  targetHours: number;
}) {
  const t = useT();
  const msg = useMessage();
  const [phases, setPhases] = useState<Phase[]>(initial);
  const [state, setState] = useState<PathState>({});
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState<{ phase: number; index: number } | null>(null);

  const byId = new Map(courses.map((c) => [c.id, c]));
  const used = new Set(phases.flatMap((p) => p.courses.map((c) => c.courseId)));
  const totalHours = phases.reduce(
    (s, p) => s + p.courses.reduce((cs, c) => cs + (byId.get(c.courseId)?.hours ?? 0), 0),
    0,
  );

  const update = (fn: (draft: Phase[]) => void) =>
    setPhases((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const move = (pi: number, from: number, to: number) =>
    update((d) => {
      if (to < 0 || to >= d[pi].courses.length) return;
      const [moved] = d[pi].courses.splice(from, 1);
      d[pi].courses.splice(to, 0, moved);
    });

  const save = () =>
    start(async () => {
      setState(await savePathStructureAction({ pathId, phases }));
    });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.phases")}</h2>
          <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
            {formatHours(totalHours)} of {formatHours(targetHours)} target
            {totalHours > 0 && Math.abs(totalHours - targetHours) > targetHours * 0.2 ? (
              <span className="ms-1 text-[var(--brand-warning)]">— well away from the target</span>
            ) : null}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => update((d) => d.push({ title: `Phase ${d.length + 1}`, description: "", courses: [] }))}
        >
          <Plus size={15} />
          {t("common.add")}
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <FormError>{msg(state.error) ?? state.error}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>
      </div>

      <ol className="mt-4 space-y-3">
        {phases.map((phase, pi) => (
          <li key={pi} className="rounded-[var(--radius-card)] border border-[var(--brand-line)] p-3">
            <div className="flex items-center gap-2">
              <span className="flex flex-col">
                <button
                  type="button"
                  aria-label={t("form.movePhaseUp")}
                  disabled={pi === 0}
                  onClick={() =>
                    update((d) => {
                      const [m] = d.splice(pi, 1);
                      d.splice(pi - 1, 0, m);
                    })
                  }
                  className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label={t("form.movePhaseDown")}
                  disabled={pi === phases.length - 1}
                  onClick={() =>
                    update((d) => {
                      const [m] = d.splice(pi, 1);
                      d.splice(pi + 1, 0, m);
                    })
                  }
                  className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </button>
              </span>
              <input
                value={phase.title}
                onChange={(e) => update((d) => void (d[pi].title = e.target.value))}
                aria-label={`Phase ${pi + 1} title`}
                className="field flex-1 font-semibold"
              />
              <button
                type="button"
                aria-label={t("form.deletePhase")}
                onClick={() => update((d) => void d.splice(pi, 1))}
                className="rounded-[var(--radius-control)] p-1.5 text-[var(--brand-muted)] hover:bg-[var(--brand-red-soft)] hover:text-[var(--brand-red)]"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <input
              value={phase.description}
              onChange={(e) => update((d) => void (d[pi].description = e.target.value))}
              placeholder={t("form.phaseDescription")}
              aria-label={`Phase ${pi + 1} description`}
              className="field mt-2 text-[13px]"
            />

            <ul className="mt-3 space-y-2">
              {phase.courses.map((c, ci) => {
                const course = byId.get(c.courseId);
                return (
                  <li
                    key={c.courseId}
                    draggable
                    onDragStart={() => setDragging({ phase: pi, index: ci })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragging && dragging.phase === pi) move(pi, dragging.index, ci);
                      setDragging(null);
                    }}
                    className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-white p-2.5"
                  >
                    <GripVertical size={15} className="cursor-grab text-[var(--brand-line)]" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--brand-ink)]">
                      {course?.title ?? c.courseId}
                    </span>
                    <span className="text-[12px] tabular-nums text-[var(--brand-muted)]">
                      {formatHours(course?.hours ?? 0)}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--brand-muted)]">
                      <input
                        type="checkbox"
                        checked={c.isRequired}
                        onChange={(e) => update((d) => void (d[pi].courses[ci].isRequired = e.target.checked))}
                        className="h-4 w-4 accent-[var(--brand-red)]"
                      />
                      {t("learning.required")}
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--brand-muted)]">
                      <input
                        type="checkbox"
                        checked={c.sequenceLock}
                        onChange={(e) => update((d) => void (d[pi].courses[ci].sequenceLock = e.target.checked))}
                        className="h-4 w-4 accent-[var(--brand-red)]"
                      />
                      Sequence lock
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.minScore ?? ""}
                      placeholder={t("form.minPercent")}
                      onChange={(e) =>
                        update(
                          (d) =>
                            void (d[pi].courses[ci].minScore = e.target.value === "" ? null : Number(e.target.value)),
                        )
                      }
                      aria-label={t("form.minimumScore")}
                      className="field w-20 py-1 text-center text-[12px]"
                    />
                    <span className="flex flex-col">
                      <button
                        type="button"
                        aria-label={t("form.moveCourseUp")}
                        disabled={ci === 0}
                        onClick={() => move(pi, ci, ci - 1)}
                        className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label={t("form.moveCourseDown")}
                        disabled={ci === phase.courses.length - 1}
                        onClick={() => move(pi, ci, ci + 1)}
                        className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </span>
                    <button
                      type="button"
                      aria-label={t("form.removeCourse")}
                      onClick={() => update((d) => void d[pi].courses.splice(ci, 1))}
                      className="rounded-[var(--radius-control)] p-1.5 text-[var(--brand-muted)] hover:bg-[var(--brand-red-soft)] hover:text-[var(--brand-red)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <label className="mt-3 block">
              <span className="sr-only">Add a course to {phase.title}</span>
              <select
                value=""
                onChange={(e) => {
                  const courseId = e.target.value;
                  if (!courseId) return;
                  update((d) =>
                    d[pi].courses.push({ courseId, isRequired: true, sequenceLock: false, minScore: null }),
                  );
                }}
                className="field text-[13px]"
              >
                <option value="">{t("common.add")} …</option>
                {courses
                  .filter((c) => !used.has(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {formatHours(c.hours)}
                    </option>
                  ))}
              </select>
            </label>
          </li>
        ))}
      </ol>

      <Button className="mt-5" onClick={save} disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </Card>
  );
}
