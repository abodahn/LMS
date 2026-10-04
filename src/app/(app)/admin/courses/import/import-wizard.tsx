"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, StatCard, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { commitCourseImportAction, previewCourseImportAction, type CourseImportState } from "./actions";

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

export function CourseImportWizard() {
  const t = useT();
  const msg = useMessage();
  const [previewState, preview] = useActionState<CourseImportState, FormData>(previewCourseImportAction, {});
  const [commitState, commit] = useActionState<CourseImportState, FormData>(commitCourseImportAction, {});

  const result = previewState.preview;
  const importable = result?.rows.filter((r) => r.status === "NEW" || r.status === "EXISTING") ?? [];

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <form action={preview} className="space-y-4">
          <FormError>{msg(previewState.error)}</FormError>
          <Field
            label={t("common.upload")}
            hint=".xlsx or .csv, up to 8 MB. Validation is instant; committing takes about a minute per thousand courses, so leave the tab open."
          >
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
            <StatCard
              label={t("form.duplicates")}
              value={result.counts.duplicates}
              tone={result.counts.duplicates ? "warning" : "neutral"}
            />
            <StatCard label={t("form.newCourses")} value={result.counts.created} />
          </div>

          <Card className="p-4">
            <p className="inline-flex items-start gap-1.5 text-[13px] font-semibold text-[var(--brand-ink)]">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[var(--brand-warning)]" aria-hidden />
              {t("form.importUnverified")}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--brand-muted)]">
              Unless you confirm the source below, nobody has opened these links yet — so the recommendation engine
              will keep them off employees&apos; paths until someone does. Work through{" "}
              <strong>Courses → Needs review</strong> to verify them. A thousand plausible URLs that nobody has checked
              is worse than twenty that work.
            </p>
          </Card>

          {result.unknown.providers.length > 0 || result.unknown.categories.length > 0 || result.unknown.departments.length > 0 ? (
            <Card className="p-4">
              <p className="text-[13px] font-semibold text-[var(--brand-ink)]">{t("form.unknownValues")}</p>
              <ul className="mt-2 space-y-1 text-[13px] text-[var(--brand-muted)]">
                {result.unknown.providers.length > 0 ? (
                  <li>New providers (will be created): {result.unknown.providers.join(", ")}</li>
                ) : null}
                {result.unknown.categories.length > 0 ? (
                  <li>Unknown categories (left blank): {result.unknown.categories.join(", ")}</li>
                ) : null}
                {result.unknown.departments.length > 0 ? (
                  <li>Unknown departments (mapping skipped): {result.unknown.departments.join(", ")}</li>
                ) : null}
              </ul>
            </Card>
          ) : null}

          <TableShell>
            <thead>
              <tr>
                <th>{t("form.line")}</th>
                <th>{t("form.code")}</th>
                <th>{t("common.course")}</th>
                <th>{t("form.provider")}</th>
                <th>{t("common.hours")}</th>
                <th>{t("common.status")}</th>
                <th>{t("form.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 200).map((r) => (
                <tr key={r.line}>
                  <td className="tabular-nums text-[var(--brand-muted)]">{r.line}</td>
                  <td className="font-mono text-[11px]">{r.data?.code ?? "—"}</td>
                  <td>{r.data?.title ?? "—"}</td>
                  <td className="text-[12px] text-[var(--brand-muted)]">{r.data?.provider ?? "—"}</td>
                  <td className="tabular-nums text-[12px]">{r.data?.hours || "—"}</td>
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
                  <td className="text-[12px] text-[var(--brand-muted)]">
                    {[...r.issues, ...r.warnings].join("; ") || "—"}
                  </td>
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

              <label className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-3">
                <input type="checkbox" name="trustLinks" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]" />
                <span className="text-[13px] leading-relaxed text-[var(--brand-charcoal)]">
                  <span className="font-semibold text-[var(--brand-ink)]">
                    {t("form.trustedSourceLabel")}
                  </span>
                  <span className="mt-0.5 block text-[var(--brand-muted)]">
                    {t("form.trustedSourceHint")}
                  </span>
                </span>
              </label>

              <p className="text-[12px] text-[var(--brand-muted)]">
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
