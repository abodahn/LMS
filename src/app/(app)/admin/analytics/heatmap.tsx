"use client";

import { useState } from "react";
import { useT } from "@/components/i18n-provider";

type Row = { name: string; headcount: number; assessed: number; scores: Record<string, number | null> };

/**
 * Departments are shaded, never ranked or labelled "worst" — the point is to
 * find where support is needed, not to shame a department.
 */
export function Heatmap({
  rows,
  competencies,
}: {
  rows: Row[];
  competencies: { key: string; name: string }[];
}) {
  const t = useT();
  const [sortKey, setSortKey] = useState<string>("name");

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    const av = a.scores[sortKey] ?? -1;
    const bv = b.scores[sortKey] ?? -1;
    return bv - av;
  });

  const shade = (value: number | null) => {
    if (value == null) return { background: "transparent", color: "var(--brand-muted)" };
    // A single hue with varying strength: readable, and not a traffic-light.
    //
    // The text stays ink at every step. The ramp tops out at 68% of the hue
    // mixed into white, which is nowhere near dark enough to carry white text —
    // switching to white above a threshold put the strongest departments at
    // 2.1:1, illegible precisely where the numbers matter most. Ink holds above
    // 5.4:1 across the whole range.
    const alpha = 0.08 + (Math.min(100, Math.max(0, value)) / 100) * 0.6;
    return {
      background: `color-mix(in srgb, var(--brand-info) ${Math.round(alpha * 100)}%, white)`,
      color: "var(--brand-ink)",
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="pb-2 text-start text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
              <button type="button" onClick={() => setSortKey("name")} className="hover:text-[var(--brand-ink)]">
                {t("common.department")}
              </button>
            </th>
            <th className="pb-2 pe-3 text-end text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
              {t("executive.assessed")}
            </th>
            {competencies.map((c) => (
              <th
                key={c.key}
                className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]"
              >
                <button type="button" onClick={() => setSortKey(c.key)} className="hover:text-[var(--brand-ink)]">
                  {c.name}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.name}>
              <td className="border-t border-[var(--brand-line)] py-2 pe-3 font-medium text-[var(--brand-ink)]">
                {r.name}
              </td>
              <td className="border-t border-[var(--brand-line)] py-2 pe-3 text-end tabular-nums text-[var(--brand-muted)]">
                {r.assessed}/{r.headcount}
              </td>
              {competencies.map((c) => {
                const value = r.scores[c.key] ?? null;
                return (
                  <td key={c.key} className="border-t border-[var(--brand-line)] p-1 text-center">
                    <span
                      className="inline-flex h-8 w-full min-w-14 items-center justify-center rounded-md text-[13px] font-semibold tabular-nums"
                      style={shade(value)}
                    >
                      {value == null ? "—" : value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
