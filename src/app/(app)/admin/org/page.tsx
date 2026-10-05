import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { humanizeKey } from "@/lib/utils";
import { Card, SectionHeading, TableShell } from "@/components/ui/primitives";
import { DepartmentManager } from "./department-manager";
import { JobTitleManager } from "./job-title-manager";
import { LocationManager } from "./location-manager";
import { localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "Organisation" };

export default async function OrgPage() {
  await requirePermission("org.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [departments, jobTitles, locations] = await Promise.all([
    prisma.department.findMany({
      include: { sections: { orderBy: { name: "asc" } }, _count: { select: { users: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.jobTitle.findMany({
      include: { department: true, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({ include: { _count: { select: { users: true } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading title={t("admin.departments")} subtitle={t("form.orgSubtitle")} />

      <DepartmentManager
        departments={departments.map((d) => ({
          id: d.id,
          code: d.code,
          name: localized(d, "name", locale),
          nameAr: d.nameAr ?? "",
          nameTr: d.nameTr ?? "",
          jobFamily: d.jobFamily,
          order: d.order,
          employees: d._count.users,
          sections: d.sections.map((s) => ({ id: s.id, name: s.name })),
        }))}
      />

      <JobTitleManager
        departments={departments.map((d) => ({ id: d.id, name: localized(d, "name", locale) }))}
        jobTitles={jobTitles.map((j) => ({
          id: j.id,
          name: j.name,
          jobFamily: j.jobFamily,
          departmentId: j.departmentId ?? "",
          departmentName: j.department ? localized(j.department, "name", locale) : null,
          isTechnical: j.isTechnical,
          isManagerial: j.isManagerial,
          isCritical: j.isCritical,
          employees: j._count.users,
        }))}
      />

      <LocationManager
        locations={locations.map((l) => ({ id: l.id, name: l.name, country: l.country, company: l.company, employees: l._count.users }))}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.jobFamilies")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {t("form.jobFamilyHint")}
        </p>
        <TableShell className="mt-4">
          <thead>
            <tr>
              <th>{t("form.family")}</th>
              <th>{t("form.jobTitles")}</th>
              <th>{t("common.employees")}</th>
            </tr>
          </thead>
          <tbody>
            {[...new Set(jobTitles.map((j) => j.jobFamily))].sort().map((family) => (
              <tr key={family}>
                <td className="font-medium text-[var(--brand-ink)]">{humanizeKey(family)}</td>
                <td className="tabular-nums">{jobTitles.filter((j) => j.jobFamily === family).length}</td>
                <td className="tabular-nums">
                  {jobTitles.filter((j) => j.jobFamily === family).reduce((s, j) => s + j._count.users, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>
    </div>
  );
}
