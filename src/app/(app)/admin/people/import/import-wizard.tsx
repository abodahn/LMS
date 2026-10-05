"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, StatCard, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import type { TemporaryCredential } from "@/lib/import/employees";
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

/** The new people's temporary passwords, shown once, with a download for handing them out. */
function TemporaryPasswords({ list }: { list: TemporaryCredential[] }) {
  const t = useT();
  const download = () => {
    // Excel reads a cell starting = + - @ (or a tab or return) as a formula; a leading quote keeps it text.
    const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
    const rows = [
      [t("profile.employeeId"), t("profile.fullName"), t("profile.email"), t("form.temporaryPassword")],
      ...list.map((c) => [c.employeeCode, c.fullName, c.email, c.password]),
    ];
    // Tab-separated UTF-16 with a byte-order mark: Excel opens it in columns
    // whatever the region's list separator, with Arabic and Turkish intact.
    const text = `\uFEFF${rows.map((r) => r.map(cell).join("\t")).join("\r\n")}`;
    const bytes = new Uint8Array(text.length * 2);
    for (let i = 0; i < text.length; i++) {
      bytes[i * 2] = text.charCodeAt(i) & 0xff;
      bytes[i * 2 + 1] = text.charCodeAt(i) >> 8;
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: "text/csv;charset=utf-16le" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "temporary-passwords.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">{t("form.temporaryPasswordsTitle")}</h2>
      <p className="text-[13px] text-[var(--brand-muted)]">{t("form.temporaryPasswordsIntro")}</p>
      <Button type="button" onClick={download}>
        <Download size={16} />
        {t("form.downloadTemporaryPasswords")}
      </Button>
      <TableShell>
        <thead>
          <tr>
            <th>{t("profile.employeeId")}</th>
            <th>{t("profile.fullName")}</th>
            <th>{t("form.temporaryPassword")}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.employeeCode}>
              <td className="font-mono text-[12px]">{c.employeeCode}</td>
              <td>{c.fullName}</td>
              <td className="font-mono text-[12px]">{c.password}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Card>
  );
}

export function ImportWizard() {
  const t = useT();
  const msg = useMessage();
  const [previewState, preview] = useActionState<ImportState, FormData>(previewImportAction, {});
  // The previous state is not sent back to the server: it holds the passwords
  // just issued. They stay on screen — a second commit adds to them, and one
  // that fails does not wipe them.
  const [commitState, commit] = useActionState<ImportState, FormData>(async (prev, formData) => {
    try {
      const next = await commitImportAction({}, formData);
      return { ...next, credentials: [...(prev.credentials ?? []), ...(next.credentials ?? [])] };
    } catch {
      return { error: "errors.generic", credentials: prev.credentials };
    }
  }, {});

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
              <FormSuccess>{msg(commitState.success, commitState.params)}</FormSuccess>

              <p className="text-[12px] text-[var(--brand-muted)]">{t("form.temporaryPasswordsHint")}</p>

              <p className="inline-flex items-start gap-1.5 text-[12px] text-[var(--brand-muted)]">
                <Copy size={13} className="mt-0.5 shrink-0" aria-hidden />
                {t("form.peopleImportSkipHint")}
              </p>

              <CommitSubmit count={importable.length} />
            </form>
          </Card>
        </>
      ) : null}

      {/* Outside the preview, so uploading another file does not hide passwords already issued. */}
      {commitState.credentials?.length ? <TemporaryPasswords list={commitState.credentials} /> : null}
    </div>
  );
}
