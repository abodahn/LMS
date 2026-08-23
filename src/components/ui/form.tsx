"use client";

import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

type FieldWrapProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
};

export function Field({ label, hint, error, required, children, className }: FieldWrapProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label className="label" htmlFor={id}>
        {label}
        {required ? <span className="ms-1 text-[var(--brand-red)]">*</span> : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? (
        <p id={hintId} className="hint mt-1.5">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="mt-1.5 text-[13px] font-medium text-[var(--brand-red)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn("field", className)} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn("field min-h-24 resize-y", className)} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={cn("field appearance-none bg-white pe-8", className)}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3 transition-colors",
        "hover:border-[var(--brand-charcoal)] has-[:checked]:border-[var(--brand-red)] has-[:checked]:bg-[var(--brand-red-soft)]",
        className,
      )}
    >
      <input
        {...props}
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--brand-ink)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[13px] text-[var(--brand-muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function RadioCard({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3 transition-colors",
        "hover:border-[var(--brand-charcoal)] has-[:checked]:border-[var(--brand-red)] has-[:checked]:bg-[var(--brand-red-soft)]",
        className,
      )}
    >
      <input {...props} id={id} type="radio" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--brand-ink)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[13px] text-[var(--brand-muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-control)] border border-[color-mix(in_srgb,var(--brand-red)_35%,transparent)] bg-[var(--brand-red-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--brand-red-dark)]"
    >
      {children}
    </div>
  );
}

export function FormSuccess({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="status"
      className="rounded-[var(--radius-control)] border border-[#BFE3D2] bg-[#EAF6F0] px-3.5 py-2.5 text-[13px] font-medium text-[var(--brand-success)]"
    >
      {children}
    </div>
  );
}
