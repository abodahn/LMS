import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// --- surfaces --------------------------------------------------------------

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("card", className)} />;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold text-[var(--brand-ink)] sm:text-[26px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--brand-muted)]">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

// --- status ----------------------------------------------------------------

type Tone = "neutral" | "brand" | "success" | "warning" | "info" | "muted";

const TONES: Record<Tone, string> = {
  neutral: "bg-[var(--brand-canvas)] text-[var(--brand-charcoal)] border-[var(--brand-line)]",
  brand: "bg-[var(--brand-red-soft)] text-[var(--brand-red-dark)] border-[color-mix(in_srgb,var(--brand-red)_25%,transparent)]",
  success: "bg-[#EAF6F0] text-[var(--brand-success)] border-[#BFE3D2]",
  warning: "bg-[#FDF3E3] text-[var(--brand-warning)] border-[#F2DDB8]",
  info: "bg-[#EAF1FA] text-[var(--brand-info)] border-[#C4D8F0]",
  muted: "bg-white text-[var(--brand-muted)] border-[var(--brand-line)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5 text-[12px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Status is always word + colour, never colour alone (accessibility). */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  const tone: Tone =
    status === "COMPLETED" || status === "VERIFIED" || status === "APPROVED" || status === "VALID" || status === "PUBLISHED" || status === "ACTIVE"
      ? "success"
      : status === "IN_PROGRESS" || status === "UNDER_REVIEW" || status === "SUBMITTED"
        ? "info"
        : status === "PENDING" || status === "PENDING_VERIFICATION" || status === "NEEDS_WORK" || status === "DRAFT"
          ? "warning"
          : status === "REJECTED" || status === "REVOKED" || status === "DROPPED" || status === "INACTIVE"
            ? "brand"
            : "muted";
  return <Badge tone={tone}>{label ?? humanize(status)}</Badge>;
}

function humanize(v: string) {
  return v
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// --- progress --------------------------------------------------------------

export function Progress({
  value,
  label,
  className,
  tone = "brand",
}: {
  value: number;
  label?: string;
  className?: string;
  tone?: "brand" | "success" | "ink";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill =
    tone === "success" ? "var(--brand-success)" : tone === "ink" ? "var(--brand-charcoal)" : "var(--brand-red)";
  return (
    <div className={className}>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${pct}% complete`}
      >
        <div className="progress-fill" style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}

// --- data display ----------------------------------------------------------

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        {/* Sentence case, not tracked capitals: the figure is the thing to
            look at, and the label should get out of its way. */}
        <p className="text-[13px] font-medium text-[var(--brand-muted)]">{label}</p>
        {icon ? <span className={cn("rounded-lg border p-1", TONES[tone])}>{icon}</span> : null}
      </div>
      <p className="tabular mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.02em] text-[var(--brand-ink)]">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[12px] text-[var(--brand-muted)]">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--brand-line)] bg-[var(--brand-canvas)] text-[var(--brand-muted)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[var(--brand-ink)]">{title}</h3>
      {body ? <p className="max-w-md text-sm text-[var(--brand-muted)]">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Wraps wide tables so the page itself never scrolls sideways. */
export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table className="data-table">{children}</table>
    </div>
  );
}

export function DefinitionRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--brand-line)] py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-48 shrink-0 text-[13px] font-medium text-[var(--brand-muted)]">{term}</dt>
      <dd className="text-sm text-[var(--brand-ink)]">{children}</dd>
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  icon,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border p-4 text-sm", TONES[tone])} role="status">
      <div className="flex gap-3">
        {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className={cn(title && "mt-1", "leading-relaxed")}>{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
