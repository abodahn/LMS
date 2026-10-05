"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { JOB_FAMILIES } from "@/lib/constants";

export type OrgState = { error?: string; success?: string };

const departmentSchema = z.object({
  departmentId: z.string().optional(),
  code: z.string().trim().min(2).max(10),
  name: z.string().trim().min(2).max(120),
  nameAr: z.string().trim().max(120).optional(),
  nameTr: z.string().trim().max(120).optional(),
  jobFamily: z.enum(JOB_FAMILIES),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveDepartmentAction(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const admin = await requirePermission("org.manage");
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const clash = await prisma.department.findFirst({
    where: { code: d.code, ...(d.departmentId ? { NOT: { id: d.departmentId } } : {}) },
  });
  if (clash) return { error: "errors.validation" };

  const data = {
    code: d.code.toUpperCase(),
    name: d.name,
    nameAr: d.nameAr || null,
    nameTr: d.nameTr || null,
    jobFamily: d.jobFamily,
    order: d.order,
  };

  const department = d.departmentId
    ? await prisma.department.update({ where: { id: d.departmentId }, data })
    : await prisma.department.create({ data });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.departmentId ? "DEPARTMENT_UPDATE" : "DEPARTMENT_CREATE",
    entity: "Department",
    entityId: department.id,
    after: data,
  });

  revalidatePath("/admin/org");
  return { success: "common.saved" };
}

const sectionSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
});

export async function addSectionAction(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const admin = await requirePermission("org.manage");
  const parsed = sectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const existing = await prisma.section.findFirst({
    where: { departmentId: parsed.data.departmentId, name: parsed.data.name },
  });
  if (existing) return { error: "errors.validation" };

  await prisma.section.create({ data: parsed.data });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "SECTION_CREATE",
    entity: "Section",
    summary: parsed.data.name,
  });
  revalidatePath("/admin/org");
  return { success: "common.saved" };
}

const jobTitleSchema = z.object({
  jobTitleId: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  jobFamily: z.enum(JOB_FAMILIES),
  departmentId: z.string().optional(),
  isTechnical: z.string().optional(),
  isManagerial: z.string().optional(),
  isCritical: z.string().optional(),
});

export async function saveJobTitleAction(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const admin = await requirePermission("org.manage");
  const parsed = jobTitleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const clash = await prisma.jobTitle.findFirst({
    where: { name: d.name, ...(d.jobTitleId ? { NOT: { id: d.jobTitleId } } : {}) },
  });
  if (clash) return { error: "errors.validation" };

  const data = {
    name: d.name,
    jobFamily: d.jobFamily,
    departmentId: d.departmentId || null,
    isTechnical: !!d.isTechnical,
    isManagerial: !!d.isManagerial,
    isCritical: !!d.isCritical,
  };

  const jobTitle = d.jobTitleId
    ? await prisma.jobTitle.update({ where: { id: d.jobTitleId }, data })
    : await prisma.jobTitle.create({ data });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.jobTitleId ? "JOB_TITLE_UPDATE" : "JOB_TITLE_CREATE",
    entity: "JobTitle",
    entityId: jobTitle.id,
    after: data,
  });

  // A title's skill requirements are derived from its family and flags, so a
  // change here changes what the job asks of people. Recomputed now rather
  // than at the next restart, which is when a new or edited title used to
  // pick them up — leaving everyone in it with an empty skills matrix until
  // then.
  // The title itself is already saved; if this fails, the next boot recomputes
  // it, so the admin is not shown an error for a save that happened.
  try {
    const { syncTitleRequirements } = await import("../../../../../prisma/seed/skills");
    await syncTitleRequirements(prisma, jobTitle.id);
  } catch (error) {
    console.error("job title requirements not refreshed", error instanceof Error ? error.message : "unknown");
  }

  revalidatePath("/admin/org");
  return { success: "common.saved" };
}

const locationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().max(80).optional(),
  company: z.enum(["TC", "TCAP"]).default("TC"),
});

export async function addLocationAction(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const admin = await requirePermission("org.manage");
  const parsed = locationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const existing = await prisma.location.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "errors.validation" };

  await prisma.location.create({
    data: { name: parsed.data.name, country: parsed.data.country || null, company: parsed.data.company },
  });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "LOCATION_CREATE",
    entity: "Location",
    summary: parsed.data.name,
  });
  revalidatePath("/admin/org");
  return { success: "common.saved" };
}

/**
 * Which company a location belongs to. People there receive that company's
 * certificates from now on; certificates already issued keep their issuer.
 */
export async function setLocationCompanyAction(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const admin = await requirePermission("org.manage");
  const parsed = z.object({ id: z.string().min(1), company: z.enum(["TC", "TCAP"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const before = await prisma.location.findUnique({ where: { id: parsed.data.id } });
  if (!before) return { error: "errors.validation" };
  if (before.company === parsed.data.company) return { success: "common.saved" };

  await prisma.location.update({ where: { id: before.id }, data: { company: parsed.data.company } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "LOCATION_COMPANY_SET",
    entity: "Location",
    entityId: before.id,
    summary: `${before.name}: ${before.company} → ${parsed.data.company}`,
  });
  revalidatePath("/admin/org");
  return { success: "common.saved" };
}
