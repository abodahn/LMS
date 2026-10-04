"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { reviewCoursesAction, type ReviewState } from "./actions";

export type PendingRow = {
  id: string;
  title: string;
  altTitle: string | null;
  url: string | null;
  provider: string;
  source: string;
  language: string;
  hours: string;
  certificate: boolean;
  contentType: string;
  category: string | null;
  attribution: string | null;
  editHref: string;
};

function Decide({ decision, label, variant }: { decision: string; label: string; variant: "primary" | "secondary" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="decision" value={decision} size="sm" variant={variant} disabled={pending}>
      {label}
    </Button>
  );
}

/**
 * Many rows, one decision.
 *
 * A harvest proposes courses in dozens, so deciding one at a time would mean
 * nobody decides at all. The selection is explicit, though — nothing is
 * pre-ticked — because approving a course puts it in front of every employee.
 *
 * The ids sent are the selection held in state, written as hidden fields, not
 * the checkboxes themselves. React resets a form after every action, and a
 * reset unticks checkboxes on screen while the component still holds them as
 * selected: a reject refused for want of a reason left its course invisibly
 * selected, and the next Approve published it. The checkboxes are now only
 * the way to change the selection, remounted after each action so what is
 * shown is what will be sent, and a decision that succeeds clears it.
 */
export function ReviewForm({ rows }: { rows: PendingRow[] }) {
  const t = useT();
  const msg = useMessage();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, action] = useActionState<ReviewState & { round: number }, FormData>(
    async (prev, form) => {
      const result = await reviewCoursesAction(prev, form);
      if (result.success) setSelected(new Set());
      return { ...result, round: prev.round + 1 };
    },
    { round: 0 },
  );
  // Only what is on screen can be sent. The page's state outlives a change of
  // source filter, and a course selected under one filter must not be
  // decided while another is showing.
  const visible = new Set(rows.map((r) => r.id));
  const chosen = [...selected].filter((id) => visible.has(id));
  const all = rows.length > 0 && chosen.length === rows.length;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form action={action} className="space-y-4">
      {/* The first submit button is the one Enter presses. Disabled, it makes
          Enter do nothing — without it, typing a rejection reason and pressing
          Enter approved the selection, because Approve came first. */}
      <button type="submit" disabled hidden aria-hidden tabIndex={-1} />
      {chosen.map((id) => (
        <input key={`${id}:${state.round}`} type="hidden" name="courseId" value={id} />
      ))}
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <div className="sticky top-[57px] z-10 flex lg:top-[49px] flex-wrap items-end gap-2 rounded-[var(--radius-card)] border border-[var(--brand-line)] bg-[var(--brand-surface)] p-3">
        <label className="flex items-center gap-2 text-[13px]">
          <input
            key={`all:${state.round}`}
            type="checkbox"
            checked={all}
            onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
            aria-label={t("review.selectAll")}
          />
          {t("review.selected", { count: chosen.length })}
        </label>
        <div className="ms-auto flex flex-wrap items-end gap-2">
          <TextInput
            name="note"
            maxLength={500}
            aria-label={t("review.noteLabel")}
            placeholder={t("review.notePlaceholder")}
            className="h-8 w-64 text-[13px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          />
          <Decide decision="APPROVE" label={t("review.approve")} variant="primary" />
          <Decide decision="FEATURE" label={t("review.feature")} variant="secondary" />
          <Decide decision="REJECT" label={t("review.reject")} variant="danger" />
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4"
          >
            <input
              key={`${r.id}:${state.round}`}
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={() => toggle(r.id)}
              aria-label={r.title}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[14px] font-medium text-[var(--brand-ink)]">{r.title}</p>
                <a href={r.editHref} className="text-[12px] text-[var(--brand-muted)] underline underline-offset-2">
                  {t("review.edit")}
                </a>
              </div>
              {r.altTitle ? (
                <p className="text-[13px] text-[var(--brand-charcoal)]" dir="auto">
                  {r.altTitle}
                </p>
              ) : null}
              <p className="mt-1 text-[12px] text-[var(--brand-muted)]">
                {[r.provider, r.source, r.language.toUpperCase(), r.hours, r.contentType, r.category, r.certificate ? t("common.certificate") : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {r.attribution ? <p className="text-[11px] text-[var(--brand-muted)]">{r.attribution}</p> : null}
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-block break-all text-[12px] text-[var(--brand-info)] underline underline-offset-2"
                >
                  {r.url}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </form>
  );
}
