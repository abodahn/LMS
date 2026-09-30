"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/components/i18n-provider";
import { formatHours } from "@/lib/utils";

type Hit = { id: string; title: string; estimatedHours: number; isInternal: boolean };

/**
 * Search-as-you-type course choice, submitting a hidden `name` field.
 *
 * Replaces a native select that had to carry the entire catalogue. The
 * behaviour follows the ARIA combobox pattern — arrow keys move, Enter picks,
 * Escape closes — so it works from a keyboard and is announced by a screen
 * reader, which a hand-rolled dropdown usually is not.
 *
 * `required` is enforced by a hidden text input that the browser validates: an
 * empty hidden field would otherwise let the form submit with no course, and
 * the server would answer with a generic validation error nobody can place.
 */
export function CoursePicker({
  name,
  required,
  exclude = [],
  id: givenId,
  "aria-describedby": describedBy,
}: {
  name: string;
  required?: boolean;
  exclude?: string[];
  id?: string;
  "aria-describedby"?: string;
}) {
  const t = useT();
  const autoId = useId();
  const id = givenId ?? autoId;
  const listId = `${id}-list`;

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState<Hit | null>(null);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    if (picked && query === picked.title) return;
    const q = query.trim();
    // Too short to search: nothing to fetch. What is shown is derived from the
    // query at render (see `visible`), so no state has to be reset here.
    if (q.length < 2) return;
    // Debounced, and only the latest request may write results: a slow answer
    // to "ex" must not overwrite a fast answer to "excel".
    const ticket = ++request.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const body = res.ok ? ((await res.json()) as { courses: Hit[] }) : { courses: [] };
        if (ticket === request.current) {
          setHits(body.courses.filter((c) => !exclude.includes(c.id)));
          setActive(-1);
          setOpen(true);
        }
      } finally {
        if (ticket === request.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
    // `exclude` is compared by content through the filter; re-running on its
    // identity would refetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, picked]);

  const visible = query.trim().length >= 2 ? hits : [];

  const choose = (hit: Hit) => {
    setPicked(hit);
    setQuery(hit.title);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && open && active >= 0 && visible[active]) {
      // Enter picks rather than submits while the list is open — submitting a
      // half-typed name is never what somebody pressing Enter in a list meant.
      e.preventDefault();
      choose(visible[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && visible.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={describedBy}
        className="field"
        placeholder={t("form.searchCourse")}
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.currentTarget.value);
          if (picked) setPicked(null);
        }}
        onFocus={() => visible.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      <input type="hidden" name={name} value={picked?.id ?? ""} />
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={picked?.id ?? ""}
          onChange={() => {}}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0"
        />
      ) : null}

      {open && (visible.length > 0 || (!loading && query.trim().length >= 2)) ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-[var(--radius-control)] border border-[var(--brand-line)] bg-[var(--brand-surface)] py-1 shadow-[var(--shadow-pop)]"
        >
          {visible.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-[var(--brand-muted)]">{t("common.noResults")}</li>
          ) : (
            visible.map((h, i) => (
              <li
                key={h.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className="cursor-pointer px-3 py-2 text-[13px]"
                style={{ background: i === active ? "var(--brand-canvas)" : undefined }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(h);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="block text-[var(--brand-ink)]">{h.title}</span>
                <span className="text-[12px] text-[var(--brand-muted)]">
                  {formatHours(h.estimatedHours)}
                  {h.isInternal ? ` · ${t("form.internalBadge")}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
