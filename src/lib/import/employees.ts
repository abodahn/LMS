// No `server-only`: the course importer alongside this one is already callable
// from scripts, and validating a roster file offline needs the same.
import { z } from "zod";
import { prisma } from "../db";
import { hashTemporaryPassword, temporaryPassword } from "../password";
import type { ParsedRow } from "./parse";
import { LOCALES } from "../constants";

export const EMPLOYEE_IMPORT_COLUMNS = [
  "Employee ID",
  "Full Name",
  "Email",
  "Department",
  "Section",
  "Job Title",
  "Manager Employee ID",
  "Location",
  "Language",
  "Years Experience",
  "AI Experience",
  "Technical",
  "Weekly Hours",
] as const;

const rowSchema = z.object({
  employeeCode: z.string().trim().min(2).max(40),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  department: z.string().trim().optional(),
  section: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  managerCode: z.string().trim().optional(),
  location: z.string().trim().optional(),
  language: z.string().trim().optional(),
  yearsExperience: z.string().trim().optional(),
  aiExperience: z.string().trim().optional(),
  technical: z.string().trim().optional(),
  weeklyHours: z.string().trim().optional(),
});

export type ImportRowResult = {
  line: number;
  raw: ParsedRow;
  status: "NEW" | "EXISTING" | "DUPLICATE" | "INVALID";
  issues: string[];
  data?: z.infer<typeof rowSchema>;
};

export type ImportPreview = {
  headers: string[];
  rows: ImportRowResult[];
  counts: { total: number; valid: number; invalid: number; duplicates: number; created: number; updated: number };
  unknown: { departments: string[]; jobTitles: string[]; locations: string[]; managers: string[] };
};

const pick = (row: ParsedRow, ...names: string[]) => {
  for (const n of names) {
    const key = Object.keys(row).find((k) => k.toLowerCase().replace(/\s+/g, "") === n.toLowerCase().replace(/\s+/g, ""));
    if (key && row[key]) return row[key];
  }
  return "";
};

/** Validates the whole file first so an administrator can fix errors before committing. */
export async function previewEmployeeImport(file: File): Promise<ImportPreview> {
  // Loaded here rather than at module scope: the spreadsheet reader pulls in
  // ExcelJS and `server-only`, and validating rows needs neither.
  const { parseUploadedTable } = await import("../spreadsheet");
  const { headers, rows } = await parseUploadedTable(file);
  return validateEmployeeRows(headers, rows);
}

/**
 * Validation is separated from parsing so the commit step can re-validate the
 * rows the browser sends back — the preview's verdict is never trusted.
 */
export async function validateEmployeeRows(headers: string[], rows: ParsedRow[]): Promise<ImportPreview> {
  const [departments, jobTitles, locations, existingUsers] = await Promise.all([
    prisma.department.findMany(),
    prisma.jobTitle.findMany(),
    prisma.location.findMany(),
    prisma.user.findMany({ select: { employeeCode: true, email: true } }),
  ]);

  const byCode = new Map(existingUsers.map((u) => [u.employeeCode.toLowerCase(), u]));
  const byEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));
  const seenCodes = new Set<string>();
  const seenEmails = new Set<string>();

  const unknown = {
    departments: new Set<string>(),
    jobTitles: new Set<string>(),
    locations: new Set<string>(),
    managers: new Set<string>(),
  };

  const results: ImportRowResult[] = rows.map((raw, i) => {
    const candidate = {
      employeeCode: pick(raw, "Employee ID", "EmployeeCode", "Code"),
      fullName: pick(raw, "Full Name", "Name"),
      email: pick(raw, "Email"),
      department: pick(raw, "Department"),
      section: pick(raw, "Section"),
      jobTitle: pick(raw, "Job Title", "Position"),
      managerCode: pick(raw, "Manager Employee ID", "Manager"),
      location: pick(raw, "Location"),
      language: pick(raw, "Language"),
      yearsExperience: pick(raw, "Years Experience"),
      aiExperience: pick(raw, "AI Experience"),
      technical: pick(raw, "Technical"),
      weeklyHours: pick(raw, "Weekly Hours"),
    };

    const parsed = rowSchema.safeParse(candidate);
    const issues: string[] = [];

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push(`${issue.path.join(".") || "row"}: ${issue.message}`);
      }
      return { line: i + 2, raw, status: "INVALID", issues };
    }

    const data = parsed.data;
    const codeKey = data.employeeCode.toLowerCase();
    const emailKey = data.email.toLowerCase();

    if (seenCodes.has(codeKey) || seenEmails.has(emailKey)) {
      return { line: i + 2, raw, status: "DUPLICATE", issues: ["Repeated in this file"], data };
    }
    seenCodes.add(codeKey);
    seenEmails.add(emailKey);

    if (data.department && !departments.some((d) => d.name.toLowerCase() === data.department!.toLowerCase() || d.code.toLowerCase() === data.department!.toLowerCase())) {
      unknown.departments.add(data.department);
      issues.push(`Unknown department "${data.department}"`);
    }
    if (data.jobTitle && !jobTitles.some((j) => j.name.toLowerCase() === data.jobTitle!.toLowerCase())) {
      unknown.jobTitles.add(data.jobTitle);
      issues.push(`Unknown job title "${data.jobTitle}"`);
    }
    if (data.location && !locations.some((l) => l.name.toLowerCase() === data.location!.toLowerCase())) {
      unknown.locations.add(data.location);
      issues.push(`Unknown location "${data.location}"`);
    }
    if (data.language && !(LOCALES as readonly string[]).includes(data.language.toLowerCase())) {
      issues.push(`Language must be one of ${LOCALES.join(", ")}`);
    }

    // A manager may appear later in the same file, so only flag truly unknown codes.
    if (data.managerCode && !byCode.has(data.managerCode.toLowerCase())) {
      const inFile = rows.some(
        (r) => pick(r, "Employee ID", "EmployeeCode", "Code").toLowerCase() === data.managerCode!.toLowerCase(),
      );
      if (!inFile) {
        unknown.managers.add(data.managerCode);
        issues.push(`Unknown manager "${data.managerCode}"`);
      }
    }

    // An email belongs to one person: saving this row would fail.
    const owner = byEmail.get(emailKey);
    if (owner && owner.employeeCode.toLowerCase() !== codeKey) {
      issues.push(`Email already belongs to employee ${owner.employeeCode}`);
    }

    const exists = byCode.has(codeKey) || byEmail.has(emailKey);
    const blocking = issues.some(
      (m) => m.startsWith("Unknown department") || m.startsWith("Language") || m.startsWith("Email already belongs"),
    );

    return {
      line: i + 2,
      raw,
      status: blocking ? "INVALID" : exists ? "EXISTING" : "NEW",
      issues,
      data,
    };
  });

  return {
    headers,
    rows: results,
    counts: {
      total: results.length,
      valid: results.filter((r) => r.status === "NEW" || r.status === "EXISTING").length,
      invalid: results.filter((r) => r.status === "INVALID").length,
      duplicates: results.filter((r) => r.status === "DUPLICATE").length,
      created: results.filter((r) => r.status === "NEW").length,
      updated: results.filter((r) => r.status === "EXISTING").length,
    },
    unknown: {
      departments: [...unknown.departments],
      jobTitles: [...unknown.jobTitles],
      locations: [...unknown.locations],
      managers: [...unknown.managers],
    },
  };
}

export type TemporaryCredential = { employeeCode: string; fullName: string; email: string; password: string };

/**
 * Commits only the rows the preview marked as importable.
 *
 * Each new person gets a temporary password of their own, returned here once
 * for the administrator to hand out and never stored in plain text. One
 * password for everyone would let any of them sign in as a colleague who has
 * not yet, since employee ids are easy to guess.
 *
 * `canTouchPrivileged`: whether the importer may update people who hold an
 * Admin or Super Admin role. Without it those rows are skipped — a sheet must
 * not be a way to change an administrator's email and then reset into it.
 */
export async function commitEmployeeImport(preview: ImportPreview, canTouchPrivileged = false) {
  const importable = preview.rows.filter((r) => (r.status === "NEW" || r.status === "EXISTING") && r.data);
  const employeeRole = await prisma.role.findUnique({ where: { key: "EMPLOYEE" } });

  // Matched as the preview matched them, ignoring case: an exact lookup here
  // would quietly leave empty a link the preview said was fine.
  const [departments, jobTitles, locations] = await Promise.all([
    prisma.department.findMany(),
    prisma.jobTitle.findMany(),
    prisma.location.findMany(),
  ]);
  const same = (a: string, b?: string) => !!b && a.toLowerCase() === b.toLowerCase();

  let created = 0;
  let updated = 0;
  let conflicts = 0;
  const credentials: TemporaryCredential[] = [];
  const saved = new Set<string>();

  for (const row of importable) {
    const d = row.data!;
    const department = departments.find((x) => same(x.name, d.department) || same(x.code, d.department)) ?? null;
    const jobTitle = jobTitles.find((x) => same(x.name, d.jobTitle)) ?? null;
    const location = locations.find((x) => same(x.name, d.location)) ?? null;
    const section =
      department && d.section
        ? await prisma.section.findFirst({ where: { departmentId: department.id, name: d.section } })
        : null;

    const base = {
      email: d.email,
      fullName: d.fullName,
      departmentId: department?.id ?? null,
      sectionId: section?.id ?? null,
      jobTitleId: jobTitle?.id ?? null,
      locationId: location?.id ?? null,
      preferredLanguage: (d.language ?? "en").toLowerCase(),
      status: "ACTIVE",
    };

    const existing = await prisma.user.findUnique({
      where: { employeeCode: d.employeeCode },
      include: { roles: { include: { role: { select: { key: true } } } } },
    });
    if (existing && !canTouchPrivileged && existing.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r.role.key))) {
      continue;
    }

    const password = existing ? null : temporaryPassword();
    let user;
    try {
      user = existing
        ? await prisma.user.update({ where: { id: existing.id }, data: base })
        : await prisma.user.create({
            data: {
              employeeCode: d.employeeCode,
              passwordHash: await hashTemporaryPassword(password!),
              mustChangePassword: true,
              ...base,
            },
          });
    } catch (e) {
      // The email already belongs to someone else. Skipped rather than failing
      // the rest of the file — the rows before it are already saved.
      if ((e as { code?: string }).code !== "P2002") throw e;
      conflicts++;
      continue;
    }
    saved.add(d.employeeCode);
    if (password) credentials.push({ employeeCode: d.employeeCode, fullName: d.fullName, email: d.email, password });

    if (existing) updated++;
    else {
      created++;
      if (employeeRole) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: employeeRole.id } },
          update: {},
          create: { userId: user.id, roleId: employeeRole.id },
        });
      }
    }

    await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {
        yearsExperience: d.yearsExperience ? Number(d.yearsExperience) || null : undefined,
        aiExperience: normaliseExperience(d.aiExperience),
        isTechnical: truthy(d.technical) ?? jobTitle?.isTechnical ?? false,
        weeklyLearningHours: d.weeklyHours ? Number(d.weeklyHours) || 2 : 2,
      },
      create: {
        userId: user.id,
        yearsExperience: d.yearsExperience ? Number(d.yearsExperience) || null : null,
        aiExperience: normaliseExperience(d.aiExperience),
        isTechnical: truthy(d.technical) ?? jobTitle?.isTechnical ?? false,
        weeklyLearningHours: d.weeklyHours ? Number(d.weeklyHours) || 2 : 2,
      },
    });
  }

  // Manager links resolved afterwards so order in the file does not matter.
  // Only for rows saved above: a skipped row has no one to link.
  for (const row of importable) {
    const d = row.data!;
    if (!d.managerCode || !saved.has(d.employeeCode)) continue;
    const manager = await prisma.user.findUnique({ where: { employeeCode: d.managerCode } });
    if (manager) {
      await prisma.user.update({ where: { employeeCode: d.employeeCode }, data: { managerId: manager.id } });
    }
  }

  return { created, updated, skipped: preview.rows.length - importable.length + conflicts, credentials };
}

function normaliseExperience(value?: string) {
  const v = (value ?? "").toUpperCase().trim();
  const allowed = ["NONE", "TRIED", "OCCASIONAL", "REGULAR", "ADVANCED"];
  return allowed.includes(v) ? v : "NONE";
}

function truthy(value?: string): boolean | undefined {
  if (!value) return undefined;
  return ["yes", "y", "true", "1"].includes(value.toLowerCase().trim());
}
