import { ArrowRight } from "lucide-react";

type Series = { overall: number; scores: { key: string; name: string; value: number }[] };

/**
 * Before / after comparison. Deliberately a paired bar per competency rather
 * than a chart library — it reads instantly on a phone and prints cleanly in
 * the executive report.
 */
export function BeforeAfter({
  before,
  after,
  labels,
}: {
  before: Series;
  after: Series;
  labels: { before: string; after: string; improvement: string };
}) {
  const rows = after.scores.map((a) => {
    const b = before.scores.find((x) => x.key === a.key);
    return { key: a.key, name: a.name, before: b?.value ?? 0, after: a.value };
  });
  const delta = Math.round(after.overall - before.overall);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-4">
        <Figure label={labels.before} value={Math.round(before.overall)} />
        <ArrowRight size={18} className="text-[var(--brand-muted)] rtl:rotate-180" aria-hidden />
        <Figure label={labels.after} value={Math.round(after.overall)} />
        <div className="ms-auto text-end">
          <p className="section-title">{labels.improvement}</p>
          <p
            className={`mt-0.5 text-2xl font-semibold tabular-nums ${
              delta >= 0 ? "text-[var(--brand-success)]" : "text-[var(--brand-red)]"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium text-[var(--brand-ink)]">{r.name}</span>
              <span className="text-[13px] tabular-nums text-[var(--brand-muted)]">
                {Math.round(r.before)} <span aria-hidden>→</span>{" "}
                <span className="font-semibold text-[var(--brand-ink)]">{Math.round(r.after)}</span>
              </span>
            </div>
            <div className="mt-1.5 space-y-1">
              <Bar value={r.before} color="var(--brand-line)" srLabel={`${r.name} before ${Math.round(r.before)}%`} />
              <Bar value={r.after} color="var(--brand-red)" srLabel={`${r.name} after ${Math.round(r.after)}%`} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="section-title">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--brand-ink)]">{value}</p>
    </div>
  );
}

function Bar({ value, color, srLabel }: { value: number; color: string; srLabel: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-canvas)]" role="img" aria-label={srLabel}>
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}
