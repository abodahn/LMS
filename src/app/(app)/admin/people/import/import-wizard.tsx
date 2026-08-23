"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Copy, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, StatCard, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { commitImportAction, previewImportAction, type ImportState } from "../actions";

function PreviewSubmit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Upload size={16} />
      {pending ? t("common.loading") : t("common.upload")}
    </Button>
  );
}

function CommitSubmit({ count }: { count: number }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || count === 0}>
      {pending ? t("common.saving") : `${t("common.confirm")} — ${count}`}
    </Button>
  );
}

export function ImportWizard() {
  const t = useT();
  const msg = useMessage();
  const [previewState, preview] = useActionState<ImportState, FormData>(previewImportAction, {});
  const [commitState, commit] = useActionState<ImportState, FormData>(commitImportAction, {});

  const result = previewState.preview;
  const importable = result?.rows.filter((r) => r.status === "NEW" || r.status === "EXISTING") ?? [];

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <form action={preview} className="space-y-4">
          <FormError>{msg(previewState.error)}</FormError>
          <Field label={t("common.upload")} hint={t("form.uploadHintEmployees")}>
            {(p) => (
              <input
                {...p}
                type="file"
                name="file"
                accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
                className="field file:me-3 file:rounded-md file:border-0 file:bg-[var(--brand-canvas)] file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-[var(--brand-charcoal)]"
              />
            )}
          </Field>
          <PreviewSubmit />
        </form>
      </Card>

      {result ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label={t("form.rows")} value={result.counts.total} />
            <StatCard label={t("form.valid")} value={result.counts.valid} tone="success" />
            <StatCard label={t("form.invalid")} value={result.counts.invalid} tone={result.counts.invalid ? "brand" : "neutral"} />
            <StatCard label={t("form.duplicates")} value={result.counts.duplicates} tone={result.counts.duplicates ? "warning" : "neutral"} />
            <StatCard label={t("form.newEmployees")} value={result.counts.created} />
          </div>

          {result.unknown.departments.length > 0 || result.unknown.jobTitles.length > 0 ? (
            <Card className="p-4">
              <p className="text-[13px] font-semibold text-[var(--brand-ink)]">{t("form.unknownValues")}</p>
              <ul className="mt-2 space-y-1 text-[13px] text-[var(--brand-muted)]">
                {result.unknown.departments.length > 0 ? (
                  <li>Departments: {result.unknown.departments.join(", ")}</li>
                ) : null}
                {result.unknown.jobTitles.length > 0 ? <li>Job titles: {result.unknown.jobTitles.join(", ")}</li> : null}
                {result.unknown.locations.length > 0 ? <li>Locations: {result.unknown.locations.join(", ")}</li> : null}
                {result.unknown.managers.length > 0 ? <li>Managers: {result.unknown.managers.join(", ")}</li> : null}
              </ul>
              <p className="mt-2 text-[12px] text-[var(--brand-muted)]">
                {t("form.peopleImportHint")}
              </p>
            </Card>
          ) : null}

          <TableShell>
            <thead>
              <tr>
                <th>{t("form.line")}</th>
                <th>{t("profile.employeeId")}</th>
                <th>{t("profile.fullName")}</th>
                <th>{t("profile.email")}</th>
                <th>{t("common.status")}</th>
                <th>{t("form.issues")}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 200).map((r) => (
                <tr key={r.line}>
                  <td className="tabular-nums text-[var(--brand-muted)]">{r.line}</td>
                  <td className="font-mono text-[12px]">{r.data?.employeeCode ?? "—"}</td>
                  <td>{r.data?.fullName ?? "—"}</td>
                  <td className="text-[12px] text-[var(--brand-muted)]">{r.data?.email ?? "—"}</td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 text-[12px] font-medium ${
                        r.status === "INVALID" || r.status === "DUPLICATE"
                          ? "text-[var(--brand-red)]"
                          : "text-[var(--brand-success)]"
                      }`}
                    >
                      {r.status === "INVALID" || r.status === "DUPLICATE" ? (
                        <AlertCircle size={13} aria-hidden />
                      ) : (
                        <CheckCircle2 size={13} aria-hidden />
                      )}
                      {r.status}
                    </span>
                  </td>
                  <td className="text-[12px] text-[var(--brand-muted)]">{r.issues.join("; ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {result.rows.length > 200 ? (
            <p className="text-[12px] text-[var(--brand-muted)]">
              Showing the first 200 rows of {result.rows.length}. All rows are imported.
            </p>
          ) : null}

          <Card className="p-5">
            <form action={commit} className="space-y-4">
              <input
                type="hidden"
                name="payload"
                value={JSON.stringify({ headers: result.headers, rows: result.rows.map((r) => r.raw) })}
              />
              <FormError>{msg(commitState.error)}</FormError>
              <FormSuccess>{commitState.success}</FormSuccess>

              <Field
                label={t("form.tempPassword")}
                hint={t("form.tempPasswordHint")}
                required
              >
                {(p) => <TextInput {...p} name="defaultPassword" minLength={10} required defaultValue="" />}
              </Field>

              <p className="inline-flex items-start gap-1.5 text-[12px] text-[var(--brand-muted)]">
                <Copy size={13} className="mt-0.5 shrink-0" aria-hidden />
                {t("form.peopleImportSkipHint")}
              </p>

              <CommitSubmit count={importable.length} />
            </form>
          </Card>
        </>
      ) : null}
    </div>
  );
}
