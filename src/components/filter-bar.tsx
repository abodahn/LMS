"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { useT } from "./i18n-provider";

type Filter = { name: string; label: string; value: string; options: { value: string; label: string }[] };

/**
 * Filtering happens on the server through the query string: the page stays
 * shareable, back works, and no list data is shipped to the client to filter.
 */
export function FilterBar({
  filters,
  searchPlaceholder,
}: {
  filters: Filter[];
  searchPlaceholder?: string;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  };

  const hasAny = [...params.keys()].length > 0;

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      {searchPlaceholder ? (
        <form
          className="min-w-52 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            setParam("q", String(value ?? ""));
          }}
        >
          <label className="label" htmlFor="filter-search">
            {t("common.search")}
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]"
              aria-hidden
            />
            <input
              id="filter-search"
              name="q"
              defaultValue={params.get("q") ?? ""}
              placeholder={searchPlaceholder}
              className="field ps-9"
            />
          </div>
        </form>
      ) : null}

      {filters.map((f) => (
        <div key={f.name} className="min-w-40">
          <label className="label" htmlFor={`filter-${f.name}`}>
            {f.label}
          </label>
          <select
            id={`filter-${f.name}`}
            className="field bg-white"
            value={f.value}
            disabled={pending}
            onChange={(e) => setParam(f.name, e.target.value)}
          >
            <option value="">{t("common.all")}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasAny ? (
        <button
          type="button"
          onClick={() => start(() => router.replace(pathname))}
          className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-3 text-[13px] font-medium text-[var(--brand-muted)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-ink)]"
        >
          <X size={14} aria-hidden />
          {t("common.clear")}
        </button>
      ) : null}
    </div>
  );
}
