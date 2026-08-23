import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, SectionHeading, TableShell } from "@/components/ui/primitives";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { AuditDetail } from "./audit-detail";
import { DownloadLink } from "@/components/download-link";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requirePermission("audit.view");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const action = typeof params.action === "string" ? params.action : "";
  const entity = typeof params.entity === "string" ? params.entity : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(q ? { OR: [{ actorName: { contains: q } }, { summary: { contains: q } }, { entityId: { contains: q } }] } : {}),
  };

  const [actions, entities, total, logs] = await Promise.all([
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.audit")}
        subtitle={`${total} entries`}
        action={
          <DownloadLink href="/api/export/audit">
            <Download size={15} />
            {t("common.exportExcel")}
          </DownloadLink>
        }
      />

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "action",
            label: "Action",
            value: action,
            options: actions.map((a) => ({ value: a.action, label: a.action })),
          },
          {
            name: "entity",
            label: "Entity",
            value: entity,
            options: entities.map((e) => ({ value: e.entity, label: e.entity })),
          },
        ]}
      />

      {logs.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.date")}</th>
                <th>{t("form.actor")}</th>
                <th>{t("form.action")}</th>
                <th>{t("form.entity")}</th>
                <th>{t("form.summary")}</th>
                <th>IP</th>
                <th className="text-end">{t("common.details")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-[13px] text-[var(--brand-muted)]">
                    {formatDateTime(l.createdAt, locale)}
                  </td>
                  <td className="text-[13px]">{l.actorName ?? "system"}</td>
                  <td>
                    <span className="rounded bg-[var(--brand-canvas)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--brand-ink)]">
                      {l.action}
                    </span>
                  </td>
                  <td className="text-[13px]">{l.entity}</td>
                  <td className="max-w-72 truncate text-[13px] text-[var(--brand-muted)]">{l.summary ?? "—"}</td>
                  <td className="font-mono text-[11.5px] text-[var(--brand-muted)]">{l.ip ?? "—"}</td>
                  <td className="text-end">
                    {l.before || l.after ? <AuditDetail before={l.before} after={l.after} /> : null}
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
