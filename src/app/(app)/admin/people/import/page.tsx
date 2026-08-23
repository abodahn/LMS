import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { EMPLOYEE_IMPORT_COLUMNS } from "@/lib/import/employees";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { ImportWizard } from "./import-wizard";
import { DownloadLink } from "@/components/download-link";

export const metadata: Metadata = { title: "Import employees" };

export default async function ImportPage() {
  await requirePermission("users.import");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/people"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.people")}
      </Link>

      <SectionHeading title={t("admin.importEmployees")} subtitle={t("form.excelOrCsv")} />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.expectedColumns")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {t("form.columnOrderHint")}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {EMPLOYEE_IMPORT_COLUMNS.map((c, i) => (
            <li
              key={c}
              className={`rounded-full border px-2.5 py-1 text-[12px] ${
                i < 3
                  ? "border-[color-mix(in_srgb,var(--brand-red)_35%,transparent)] bg-[var(--brand-red-soft)] font-medium text-[var(--brand-red-dark)]"
                  : "border-[var(--brand-line)] text-[var(--brand-muted)]"
              }`}
            >
              {c}
              {i < 3 ? " *" : ""}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-[var(--brand-muted)]">
          <DownloadLink href="/api/export/employee-template" className="px-0 text-[var(--brand-red)] underline">
            {t("common.download")} template
          </DownloadLink>
        </p>
      </Card>

      <ImportWizard />
    </div>
  );
}
