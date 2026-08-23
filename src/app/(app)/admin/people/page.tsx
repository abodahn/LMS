import type { Metadata } from "next";
import Link from "next/link";
import { Download, Upload, UserPlus } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { EmptyState, SectionHeading, StatusPill, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { LevelChip } from "@/components/level-chip";
import { Pagination } from "@/components/pagination";
import { DownloadLink } from "@/components/download-link";
import { localizeNames, localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "People" };

const PAGE_SIZE = 25;

export default async function PeoplePage({ searchParams }: PageProps<"/admin/people">) {
  await requirePermission("users.view");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const department = typeof params.department === "string" ? params.department : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    deletedAt: null,
    ...(department ? { departmentId: department } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }, { employeeCode: { contains: q } }] }
      : {}),
  };

  const [departments, total, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" } }).then((rows) => localizeNames(rows, locale)),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        department: true,
        jobTitle: true,
        roles: { include: { role: true } },
        attempts: {
          where: { status: "GRADED", definition: { type: { in: ["PLACEMENT", "FINAL"] } } },
          orderBy: { submittedAt: "desc" },
          take: 1,
          include: { level: true },
        },
      },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.people")}
        subtitle={`${total} ${t("common.employees").toLowerCase()}`}
        action={
          <>
            <LinkButton href="/admin/people/import" variant="secondary" size="sm">
              <Upload size={15} />
              {t("admin.importEmployees")}
            </LinkButton>
            <DownloadLink href="/api/export/employees">
              <Download size={15} />
              {t("common.exportExcel")}
            </DownloadLink>
            <LinkButton href="/admin/people/new" size="sm">
              <UserPlus size={15} />
              {t("common.create")}
            </LinkButton>
          </>
        }
      />

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "department",
            label: t("common.department"),
            value: department,
            options: departments.map((d) => ({ value: d.id, label: d.name })),
          },
          {
            name: "status",
            label: t("common.status"),
            value: status,
            options: [
              { value: "ACTIVE", label: t("common.active") },
              { value: "INACTIVE", label: t("common.inactive") },
            ],
          },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.employee")}</th>
                <th>{t("common.department")}</th>
                <th>{t("common.jobTitle")}</th>
                <th>{t("common.level")}</th>
                <th>{t("admin.roles")}</th>
                <th>{t("common.status")}</th>
                <th className="text-end">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">{u.fullName}</span>
                    <span className="block text-[12px] text-[var(--brand-muted)]">
                      {u.employeeCode} · {u.email}
                    </span>
                  </td>
                  <td>{u.department ? localized(u.department, "name", locale) : "—"}</td>
                  <td className="text-[13px]">{u.jobTitle?.name ?? "—"}</td>
                  <td>
                    {u.attempts[0]?.level ? (
                      <LevelChip code={u.attempts[0].level.code} size="sm" />
                    ) : (
                      <span className="text-[12px] text-[var(--brand-muted)]">{t("common.notStarted")}</span>
                    )}
                  </td>
                  <td className="text-[12px] text-[var(--brand-muted)]">
                    {u.roles.map((r) => r.role.name).join(", ") || "—"}
                  </td>
                  <td>
                    <StatusPill status={u.status} />
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/admin/people/${u.id}`}
                      className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
        </>
      )}

      <p className="text-[12px] text-[var(--brand-muted)]">
        {t("common.date")}: {formatDate(new Date(), locale)}
      </p>
    </div>
  );
}
