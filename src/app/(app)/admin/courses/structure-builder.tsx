"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { FormError, FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { LESSON_TYPES } from "@/lib/constants";
import { saveCourseStructureAction, type CourseState } from "./actions";

type Lesson = {
  id?: string;
  title: string;
  type: string;
  durationMinutes: number;
  isRequired: boolean;
  url: string;
  content: string;
};
type Module = { id?: string; title: string; description: string; lessons: Lesson[] };

const emptyLesson = (): Lesson => ({
  title: "New lesson",
  type: "TEXT",
  durationMinutes: 10,
  isRequired: true,
  url: "",
  content: "",
});

/**
 * Ordering supports drag-and-drop and up/down buttons. The buttons are not a
 * fallback — they are the only ordering method that works with a keyboard and
 * on touch, so both are kept.
 */
export function StructureBuilder({ courseId, initial }: { courseId: string; initial: Module[] }) {
  const t = useT();
  const msg = useMessage();
  const [modules, setModules] = useState<Module[]>(initial);
  const [openModule, setOpenModule] = useState<number | null>(initial.length ? 0 : null);
  const [state, setState] = useState<CourseState>({});
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState<{ module: number; lesson: number } | null>(null);

  const update = (fn: (draft: Module[]) => void) => {
    setModules((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  };

  const moveLesson = (mi: number, from: number, to: number) =>
    update((d) => {
      if (to < 0 || to >= d[mi].lessons.length) return;
      const [moved] = d[mi].lessons.splice(from, 1);
      d[mi].lessons.splice(to, 0, moved);
    });

  const moveModule = (from: number, to: number) =>
    update((d) => {
      if (to < 0 || to >= d.length) return;
      const [moved] = d.splice(from, 1);
      d.splice(to, 0, moved);
    });

  const save = () =>
    start(async () => {
      const result = await saveCourseStructureAction({
        courseId,
        modules: modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type as (typeof LESSON_TYPES)[number],
            durationMinutes: l.durationMinutes,
            isRequired: l.isRequired,
            url: l.url,
            content: l.content,
          })),
        })),
      });
      setState(result);
    });

  const totalMinutes = modules.reduce(
    (s, m) => s + m.lessons.reduce((ls, l) => ls + (Number(l.durationMinutes) || 0), 0),
    0,
  );

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("learning.modules")}</h2>
          <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
            {modules.length} modules · {modules.reduce((s, m) => s + m.lessons.length, 0)} lessons ·{" "}
            {Math.round((totalMinutes / 60) * 10) / 10} h of content
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => update((d) => d.push({ title: "New module", description: "", lessons: [emptyLesson()] }))}>
          <Plus size={15} />
          {t("common.add")}
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>
      </div>

      <ol className="mt-4 space-y-3">
        {modules.map((m, mi) => (
          <li key={mi} className="rounded-[var(--radius-card)] border border-[var(--brand-line)]">
            <div className="flex items-center gap-2 border-b border-[var(--brand-line)] p-3">
              <span className="flex flex-col">
                <button
                  type="button"
                  aria-label={t("form.moveModuleUp")}
                  onClick={() => moveModule(mi, mi - 1)}
                  className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                  disabled={mi === 0}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label={t("form.moveModuleDown")}
                  onClick={() => moveModule(mi, mi + 1)}
                  className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                  disabled={mi === modules.length - 1}
                >
                  <ChevronDown size={14} />
                </button>
              </span>

              <input
                value={m.title}
                onChange={(e) => update((d) => void (d[mi].title = e.target.value))}
                aria-label={`Module ${mi + 1} title`}
                className="field flex-1 font-semibold"
              />

              <button
                type="button"
                onClick={() => setOpenModule(openModule === mi ? null : mi)}
                aria-expanded={openModule === mi}
                className="rounded-[var(--radius-control)] px-2 py-1 text-[13px] font-medium text-[var(--brand-muted)] hover:bg-[var(--brand-canvas)]"
              >
                {m.lessons.length} lessons
              </button>

              <button
                type="button"
                aria-label={t("form.deleteModule")}
                onClick={() => update((d) => void d.splice(mi, 1))}
                className="rounded-[var(--radius-control)] p-1.5 text-[var(--brand-muted)] hover:bg-[var(--brand-red-soft)] hover:text-[var(--brand-red)]"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {openModule === mi ? (
              <div className="p-3">
                <input
                  value={m.description}
                  onChange={(e) => update((d) => void (d[mi].description = e.target.value))}
                  placeholder={t("form.moduleDescription")}
                  aria-label={`Module ${mi + 1} description`}
                  className="field mb-3 text-[13px]"
                />

                <ol className="space-y-2">
                  {m.lessons.map((l, li) => (
                    <li
                      key={li}
                      draggable
                      onDragStart={() => setDragging({ module: mi, lesson: li })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragging && dragging.module === mi) moveLesson(mi, dragging.lesson, li);
                        setDragging(null);
                      }}
                      className="rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-white p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <GripVertical size={15} className="cursor-grab text-[var(--brand-line)]" aria-hidden />
                        <input
                          value={l.title}
                          onChange={(e) => update((d) => void (d[mi].lessons[li].title = e.target.value))}
                          aria-label={`Lesson ${li + 1} title`}
                          className="field min-w-40 flex-1"
                        />
                        <select
                          value={l.type}
                          onChange={(e) => update((d) => void (d[mi].lessons[li].type = e.target.value))}
                          aria-label={`Lesson ${li + 1} type`}
                          className="field w-32"
                        >
                          {LESSON_TYPES.map((tp) => (
                            <option key={tp} value={tp}>
                              {tp}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={600}
                          value={l.durationMinutes}
                          onChange={(e) =>
                            update((d) => void (d[mi].lessons[li].durationMinutes = Number(e.target.value)))
                          }
                          aria-label={`Lesson ${li + 1} minutes`}
                          className="field w-20 text-center"
                        />
                        <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--brand-muted)]">
                          <input
                            type="checkbox"
                            checked={l.isRequired}
                            onChange={(e) => update((d) => void (d[mi].lessons[li].isRequired = e.target.checked))}
                            className="h-4 w-4 accent-[var(--brand-red)]"
                          />
                          {t("common.required")}
                        </label>
                        <span className="flex flex-col">
                          <button
                            type="button"
                            aria-label={t("form.moveLessonUp")}
                            onClick={() => moveLesson(mi, li, li - 1)}
                            disabled={li === 0}
                            className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={t("form.moveLessonDown")}
                            onClick={() => moveLesson(mi, li, li + 1)}
                            disabled={li === m.lessons.length - 1}
                            className="text-[var(--brand-muted)] hover:text-[var(--brand-ink)] disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </span>
                        <button
                          type="button"
                          aria-label={t("form.deleteLesson")}
                          onClick={() => update((d) => void d[mi].lessons.splice(li, 1))}
                          className="rounded-[var(--radius-control)] p-1.5 text-[var(--brand-muted)] hover:bg-[var(--brand-red-soft)] hover:text-[var(--brand-red)]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {["VIDEO", "YOUTUBE", "PDF", "IMAGE", "EXTERNAL", "FILE"].includes(l.type) ? (
                        <input
                          value={l.url}
                          onChange={(e) => update((d) => void (d[mi].lessons[li].url = e.target.value))}
                          placeholder="https://…"
                          aria-label={`Lesson ${li + 1} URL`}
                          className="field mt-2 text-[13px]"
                        />
                      ) : null}

                      <textarea
                        value={l.content}
                        onChange={(e) => update((d) => void (d[mi].lessons[li].content = e.target.value))}
                        placeholder={t("form.lessonContent")}
                        aria-label={`Lesson ${li + 1} content`}
                        rows={l.type === "TEXT" ? 6 : 2}
                        className="field mt-2 font-mono text-[12.5px]"
                      />
                    </li>
                  ))}
                </ol>

                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => update((d) => d[mi].lessons.push(emptyLesson()))}
                >
                  <Plus size={14} />
                  {t("learning.lesson")}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? t("common.saving") : t("common.save")}
        </Button>
        <p className="text-[12px] text-[var(--brand-muted)]">
          {t("form.structureRemoveHint")}
        </p>
      </div>
    </Card>
  );
}
