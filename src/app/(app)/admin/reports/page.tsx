import type { Metadata } from "next";
import { FileSpreadsheet, FileText } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { REPORTS } from "@/lib/reports";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { DownloadLink } from "@/components/download-link";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermission("reports.export");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <div className="space-y-6">
      <SectionHeading title={t("reports.title")} subtitle={t("common.exportExcel")} />

      <ul className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <li key={r.key}>
            <Card className="flex h-full flex-col p-5">
              <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">{t(r.labelKey)}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--brand-muted)]">{r.description}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <DownloadLink href={`/api/export/${r.key}`} variant="primary">
                  <FileSpreadsheet size={14} aria-hidden />
                  Excel
                </DownloadLink>
                <DownloadLink href={`/api/export/${r.key}?format=csv`}>
                  <FileText size={14} aria-hidden />
                  CSV
                </DownloadLink>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("executive.downloadReport")}</h2>
        <p className="mt-1.5 text-[13px] text-[var(--brand-muted)]">
          {t("form.executiveReportHint")}
        </p>
        <DownloadLink href="/api/reports/executive" variant="ink" className="mt-4 h-10 px-4 text-sm">
          <FileText size={15} aria-hidden />
          {t("common.exportPdf")}
        </DownloadLink>
      </Card>
    </div>
  );
}
