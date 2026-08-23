import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate, formatHours } from "@/lib/utils";
import { EmptyState, SectionHeading, StatCard, StatusPill, TableShell } from "@/components/ui/primitives";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { RevokeCertificate } from "./revoke-button";
import { DownloadLink } from "@/components/download-link";

export const metadata: Metadata = { title: "Certificates" };

const PAGE_SIZE = 30;

export default async function AdminCertificatesPage({ searchParams }: PageProps<"/admin/certificates">) {
  await requirePermission("certificates.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const type = typeof params.type === "string" ? params.type : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(q ? { OR: [{ code: { contains: q } }, { title: { contains: q } }, { user: { fullName: { contains: q } } }] } : {}),
  };

  const [total, valid, revoked, certificates] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.count({ where: { status: "VALID" } }),
    prisma.certificate.count({ where: { status: "REVOKED" } }),
    prisma.certificate.findMany({
      where,
      include: { user: { select: { fullName: true, employeeCode: true } }, level: true },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.certificates")}
        action={
          <DownloadLink href="/api/export/certificates">
            <Download size={15} />
            {t("common.exportExcel")}
          </DownloadLink>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("common.total")} value={total} />
        <StatCard label={t("certificates.valid")} value={valid} tone="success" />
        <StatCard label={t("certificates.revoked")} value={revoked} tone={revoked > 0 ? "brand" : "neutral"} />
      </div>

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "status",
            label: t("common.status"),
            value: status,
            options: [
              { value: "VALID", label: t("certificates.valid") },
              { value: "REVOKED", label: t("certificates.revoked") },
            ],
          },
          {
            name: "type",
            label: "Type",
            value: type,
            options: [
              { value: "COURSE", label: "Course" },
              { value: "PROGRAM", label: "Programme" },
              { value: "PATH", label: "Path" },
            ],
          },
        ]}
      />

      {certificates.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <th>{t("certificates.certificateId")}</th>
                <th>{t("common.employee")}</th>
                <th>{t("certificates.program")}</th>
                <th>{t("common.level")}</th>
                <th>{t("certificates.learningHours")}</th>
                <th>{t("certificates.issued")}</th>
                <th>{t("common.status")}</th>
                <th className="text-end">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-[12px]">
                    <Link href={`/verify/${c.code}`} className="text-[var(--brand-red)] underline-offset-4 hover:underline">
                      {c.code}
                    </Link>
                  </td>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">{c.user.fullName}</span>
                    <span className="block text-[12px] text-[var(--brand-muted)]">{c.user.employeeCode}</span>
                  </td>
                  <td className="max-w-64 truncate text-[13px]">{c.title}</td>
                  <td>{c.level?.code ?? "—"}</td>
                  <td className="tabular-nums">{formatHours(c.learningHours)}</td>
                  <td className="text-[13px] text-[var(--brand-muted)]">{formatDate(c.issuedAt, locale)}</td>
                  <td>
                    <StatusPill status={c.status} />
                  </td>
                  <td className="text-end">
                    <div className="flex items-center justify-end gap-2">
                      <DownloadLink href={`/api/certificates/${c.id}/pdf`} className="h-8">
                        PDF
                      </DownloadLink>
                      {c.status === "VALID" ? <RevokeCertificate certificateId={c.id} /> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
        </>
      )}
    </div>
  );
}
