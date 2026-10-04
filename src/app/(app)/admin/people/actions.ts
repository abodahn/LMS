"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ROLE_KEYS, LOCALES } from "@/lib/constants";
import { commitEmployeeImport, previewEmployeeImport, validateEmployeeRows, type ImportPreview } from "@/lib/import/employees";
import { generateRecommendations } from "@/lib/recommendation/service";
import { notify } from "@/lib/notifications";

export type PeopleState = { error?: string; success?: string; params?: Record<string, string> };
export type ImportState = {
  error?: string;
  success?: string;
  params?: Record<string, number>;
  preview?: ImportPreview;
};

const userSchema = z.object({
  userId: z.string().optional(),
  employeeCode: z.string().trim().min(2).max(40),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  departmentId: z.string().optional(),
  sectionId: z.string().optional(),
  jobTitleId: z.string().optional(),
  locationId: z.string().optional(),
  managerId: z.string().optional(),
  preferredLanguage: z.enum(LOCALES),
  status: z.enum(["ACTIVE", "INACTIVE", "INVITED"]),
});

export async function saveUserAction(_prev: PeopleState, formData: FormData): Promise<PeopleState> {
  const admin = await requirePermission("users.manage");
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const roles = formData.getAll("roles").map(String).filter((r) => (ROLE_KEYS as readonly string[]).includes(r));
  const d = parsed.data;
  const data = {
    employeeCode: d.employeeCode,
    fullName: d.fullName,
    email: d.email,
    departmentId: d.departmentId || null,
    sectionId: d.sectionId || null,
    jobTitleId: d.jobTitleId || null,
    locationId: d.locationId || null,
    managerId: d.managerId || null,
    preferredLanguage: d.preferredLanguage,
    status: d.status,
  };

  const clash = await prisma.user.findFirst({
    where: {
      OR: [{ employeeCode: d.employeeCode }, { email: d.email }],
      ...(d.userId ? { NOT: { id: d.userId } } : {}),
    },
  });
  if (clash) return { error: "errors.validation" };

  const before = d.userId ? await prisma.user.findUnique({ where: { id: d.userId } }) : null;

  const user = d.userId
    ? await prisma.user.update({ where: { id: d.userId }, data })
    : await prisma.user.create({
        data: { ...data, passwordHash: await hashPassword(randomPassword()), mustChangePassword: true },
      });

  const roleRows = await prisma.role.findMany({ where: { key: { in: roles.length ? roles : ["EMPLOYEE"] } } });
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  for (const r of roleRows) await prisma.userRole.create({ data: { userId: user.id, roleId: r.id } });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.userId ? "USER_UPDATE" : "USER_CREATE",
    entity: "User",
    entityId: user.id,
    before: before ?? undefined,
    after: { ...data, roles },
  });

  revalidatePath("/admin/people");
  return { success: "common.saved" };
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "INACTIVE") {
  const admin = await requirePermission("users.manage");
  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { status } });
  if (status === "INACTIVE") {
    // Deactivating must end any live session immediately.
    await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: status === "ACTIVE" ? "USER_ACTIVATE" : "USER_DEACTIVATE",
    entity: "User",
    entityId: userId,
    before: { status: before.status },
    after: { status },
  });
  revalidatePath("/admin/people");
}

export async function resetUserPasswordAction(userId: string): Promise<PeopleState> {
  const admin = await requirePermission("users.manage");
  const password = randomPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true, failedLoginCount: 0, lockedUntil: null },
  });
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "PASSWORD_RESET_ADMIN",
    entity: "User",
    entityId: userId,
  });
  // The password is shown once to the administrator and never stored in plain text.
  return { success: "form.tempPasswordSet", params: { password } };
}

export async function rebuildPathAction(userId: string): Promise<PeopleState> {
  const admin = await requirePermission("enrollments.manage");
  await generateRecommendations(userId);
  await notify(userId, {
    category: "LEARNING",
    title: "Your recommended learning has been refreshed",
    body: "Open My Learning to see the updated suggestions.",
    link: "/learning",
  });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "RECOMMENDATION_REGENERATED",
    entity: "User",
    entityId: userId,
  });
  revalidatePath(`/admin/people/${userId}`);
  return { success: "common.saved" };
}

// --- bulk import ------------------------------------------------------------

export async function previewImportAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requirePermission("users.import");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "errors.validation" };
  if (file.size > 4 * 1024 * 1024) return { error: "errors.fileTooLarge:4 MB" };

  try {
    const preview = await previewEmployeeImport(file);
    if (preview.rows.length === 0) return { error: "common.noResults" };
    return { preview };
  } catch {
    return { error: "errors.fileType:XLSX, CSV" };
  }
}

export async function commitImportAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const admin = await requirePermission("users.import");
  const payload = String(formData.get("payload") ?? "");
  const defaultPassword = String(formData.get("defaultPassword") ?? "").trim();

  if (defaultPassword.length < 10) return { error: "auth.passwordTooWeak" };

  let parsed: { headers: string[]; rows: Record<string, string>[] };
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { error: "errors.generic" };
  }

  // Re-validate server-side: the browser's verdict is never trusted.
  const preview = await validateEmployeeRows(parsed.headers, parsed.rows);
  const result = await commitEmployeeImport(preview, defaultPassword);

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "EMPLOYEE_IMPORT",
    entity: "User",
    summary: `${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
  });

  revalidatePath("/admin/people");
  return {
    success: "form.employeesImported",
    params: { created: result.created, updated: result.updated, skipped: result.skipped },
  };
}

function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return `${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}9`;
}
