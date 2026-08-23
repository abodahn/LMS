import "server-only";
import { prisma } from "@/lib/db";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";

/** Reference lists shared by the create and edit screens. */
export async function loadUserFormOptions(locale: Locale = "en") {
  const [departments, sections, jobTitles, locations, managers] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } }),
    prisma.section.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, departmentId: true } }),
    prisma.jobTitle.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, employeeCode: true },
    }),
  ]);

  return {
    departments: localizeNames(departments, locale),
    sections,
    jobTitles,
    locations,
    managers: managers.map((m) => ({ id: m.id, name: `${m.fullName} (${m.employeeCode})` })),
  };
}
