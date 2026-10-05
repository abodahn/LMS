import type { Db } from "./client";

/**
 * Job titles and the location used by the Tolba Group (T-CAP) head office, so
 * its people can be imported with their real roles.
 *
 * Created only when missing and never updated afterwards: once a title exists
 * it belongs to the administrators in /admin/org, and a later boot must not
 * undo a rename or a change of department. Titles that T&C already has
 * (Chief Executive Officer, Accountant, Finance Manager, IT Manager, HR
 * Manager, Procurement Officer) are reused rather than duplicated.
 */
/** Its people receive T-CAP certificates: a location's company decides the issuer. */
export const GROUP_LOCATION = { name: "T-CAP Head Office", country: "Egypt", company: "TCAP" };

const TITLES: { name: string; department: string; jobFamily: string; isManagerial: boolean }[] = [
  { name: "Chairman", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: true },
  { name: "Board Member", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: true },
  { name: "Chief Investment Officer", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: true },
  { name: "Technical Assistant to the CEO", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: false },
  { name: "Executive Office Manager", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: true },
  { name: "Director of Legal Affairs", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: true },
  { name: "Legal Counsel", department: "MGT", jobFamily: "MANAGEMENT", isManagerial: false },
  { name: "Chief Financial Officer", department: "FIN", jobFamily: "FINANCE", isManagerial: true },
  { name: "Accounting Manager", department: "FIN", jobFamily: "FINANCE", isManagerial: true },
  { name: "Costing & Financial Planning Manager", department: "FIN", jobFamily: "FINANCE", isManagerial: true },
  { name: "Treasury Manager", department: "FIN", jobFamily: "FINANCE", isManagerial: true },
  { name: "Assistant IT Manager", department: "IT", jobFamily: "IT", isManagerial: true },
  { name: "Customer Relations & QA Manager", department: "COM", jobFamily: "SALES_MARKETING", isManagerial: true },
  { name: "Purchasing Manager", department: "SCM", jobFamily: "SUPPLY_CHAIN", isManagerial: true },
  { name: "Import Manager", department: "SCM", jobFamily: "SUPPLY_CHAIN", isManagerial: true },
  { name: "Drawback Manager", department: "SCM", jobFamily: "SUPPLY_CHAIN", isManagerial: true },
  { name: "Export Operations Manager", department: "SCM", jobFamily: "SUPPLY_CHAIN", isManagerial: true },
];

export async function seedGroupTitles(prisma: Db) {
  let added = 0;
  const departments = await prisma.department.findMany({ select: { id: true, code: true } });
  for (const t of TITLES) {
    if (await prisma.jobTitle.findUnique({ where: { name: t.name } })) continue;
    await prisma.jobTitle.create({
      data: {
        name: t.name,
        jobFamily: t.jobFamily,
        isManagerial: t.isManagerial,
        departmentId: departments.find((d) => d.code === t.department)?.id ?? null,
      },
    });
    added++;
  }
  if (!(await prisma.location.findUnique({ where: { name: GROUP_LOCATION.name } }))) {
    await prisma.location.create({ data: GROUP_LOCATION });
    added++;
  }
  return { added };
}
