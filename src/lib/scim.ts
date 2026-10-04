import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { hashPassword } from "./password";
import { audit } from "./audit";

/**
 * HR sync over SCIM 2.0 (RFC 7643/7644): joiners, movers and leavers pushed by
 * the HR system or the identity provider (Entra ID, Okta, Workday via either),
 * replacing the CSV upload as the routine path.
 *
 * Users only — departments, job titles and managers are matched to what
 * already exists here by name, code or id, never created, because a typo in an
 * HR feed should not invent a department. A leaver is deactivated and their
 * sessions revoked, never deleted: their learning record is the company's.
 *
 * Off unless SCIM_TOKEN is set. The token lives in the environment only.
 */

export const CORE = "urn:ietf:params:scim:schemas:core:2.0:User";
export const ENTERPRISE = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User";
const LIST = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
const ERROR = "urn:ietf:params:scim:api:messages:2.0:Error";
const PATCH = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
const ACTOR = "HR sync (SCIM)";

const digest = (v: string) => createHash("sha256").update(v).digest();

/** null when the request may proceed; otherwise the response to send. */
export function scimGate(request: Request): NextResponse | null {
  const expected = process.env.SCIM_TOKEN?.trim();
  if (!expected) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  // Compared as digests so the comparison is constant-time whatever the length.
  if (!given || !timingSafeEqual(digest(given), digest(expected))) return scimError(401, "Invalid bearer token");
  return null;
}

export function scimError(status: number, detail: string, scimType?: string) {
  return NextResponse.json(
    { schemas: [ERROR], status: String(status), detail, ...(scimType ? { scimType } : {}) },
    { status, headers: { "content-type": "application/scim+json" } },
  );
}

export function scimJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "content-type": "application/scim+json" } });
}

// --- representation ---------------------------------------------------------

const userInclude = {
  department: { select: { name: true } },
  jobTitle: { select: { name: true } },
} as const;

type UserRow = {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  status: string;
  preferredLanguage: string;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  department: { name: string } | null;
  jobTitle: { name: string } | null;
};

export function toScim(u: UserRow, base: string) {
  return {
    schemas: [CORE, ENTERPRISE],
    id: u.id,
    externalId: u.employeeCode,
    userName: u.email,
    displayName: u.fullName,
    name: { formatted: u.fullName },
    emails: [{ value: u.email, type: "work", primary: true }],
    active: u.status === "ACTIVE",
    title: u.jobTitle?.name,
    preferredLanguage: u.preferredLanguage,
    [ENTERPRISE]: {
      employeeNumber: u.employeeCode,
      department: u.department?.name,
      ...(u.managerId ? { manager: { value: u.managerId } } : {}),
    },
    meta: {
      resourceType: "User",
      created: u.createdAt.toISOString(),
      lastModified: u.updatedAt.toISOString(),
      location: `${base}/Users/${u.id}`,
    },
  };
}

export type ScimUser = Record<string, unknown>;

/** What we keep from a SCIM user. Undefined means "not stated", which changes nothing. */
export type Parsed = {
  email?: string;
  fullName?: string;
  employeeCode?: string;
  active?: boolean;
  title?: string | null;
  department?: string | null;
  manager?: string | null;
  language?: string;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const bool = (v: unknown) => (typeof v === "boolean" ? v : typeof v === "string" ? v.toLowerCase() === "true" : undefined);

export function fromScim(u: ScimUser): Parsed {
  const ent = (u[ENTERPRISE] ?? {}) as Record<string, unknown>;
  const name = (u.name ?? {}) as Record<string, unknown>;
  const emails = Array.isArray(u.emails) ? (u.emails as Record<string, unknown>[]) : [];
  const email = str(u.userName)?.includes("@")
    ? str(u.userName)
    : str((emails.find((e) => e.primary === true) ?? emails[0])?.value);
  const joined = [str(name.givenName), str(name.familyName)].filter(Boolean).join(" ");
  const manager = ent.manager;
  const lang = str(u.preferredLanguage)?.slice(0, 2).toLowerCase();

  return {
    email: email?.toLowerCase(),
    fullName: str(u.displayName) ?? str(name.formatted) ?? (joined || undefined),
    employeeCode: str(ent.employeeNumber) ?? str(u.externalId),
    active: bool(u.active),
    title: "title" in u ? (str(u.title) ?? null) : undefined,
    department: "department" in ent ? (str(ent.department) ?? null) : undefined,
    manager:
      "manager" in ent
        ? (str(typeof manager === "object" && manager ? (manager as Record<string, unknown>).value : manager) ?? null)
        : undefined,
    language: lang && ["en", "ar", "tr"].includes(lang) ? lang : undefined,
  };
}

/**
 * Applies PATCH operations to the current representation and returns the
 * result, which is then read with fromScim like any PUT body. Covers what the
 * common provisioning clients send: replace/add/remove on a simple attribute,
 * on a sub-attribute (`name.givenName`), on the enterprise extension by its
 * full URN, and on `emails[type eq "work"].value`; or a replace with no path
 * and an object of attributes.
 */
export function applyPatch(current: ScimUser, body: unknown): ScimUser {
  const ops = (body as { Operations?: unknown })?.Operations;
  if (!Array.isArray(ops)) throw new Error("Operations missing");
  const doc: ScimUser = structuredClone(current);

  const setPath = (path: string, value: unknown) => {
    let target: Record<string, unknown> = doc;
    let rest = path;
    if (path.toLowerCase().startsWith(ENTERPRISE.toLowerCase() + ":")) {
      target = (doc[ENTERPRISE] ??= {}) as Record<string, unknown>;
      rest = path.slice(ENTERPRISE.length + 1);
    }
    if (/^emails\[.*\]\.value$/i.test(rest)) rest = "userName";
    const parts = rest.split(".");
    if (parts.some((p) => p === "__proto__" || p === "constructor" || p === "prototype")) {
      throw new Error("unsupported path");
    }
    for (const p of parts.slice(0, -1)) target = (target[p] ??= {}) as Record<string, unknown>;
    target[parts[parts.length - 1]] = value;
  };

  for (const raw of ops as Record<string, unknown>[]) {
    const op = String(raw.op ?? "").toLowerCase();
    const path = str(raw.path);
    if (op === "remove") {
      if (!path) throw new Error("remove needs a path");
      setPath(path, null);
    } else if (op === "replace" || op === "add") {
      if (path) setPath(path, raw.value);
      else if (raw.value && typeof raw.value === "object") {
        for (const [k, v] of Object.entries(raw.value as Record<string, unknown>)) {
          if (k === "__proto__" || k === "constructor" || k === "prototype") throw new Error("unsupported path");
          if (k === ENTERPRISE && v && typeof v === "object") {
            for (const [ek, ev] of Object.entries(v)) setPath(`${ENTERPRISE}:${ek}`, ev);
          } else setPath(k, v);
        }
      } else throw new Error("value missing");
    } else throw new Error(`unsupported op ${op}`);
  }
  return doc;
}

// --- persistence --------------------------------------------------------------

export function baseUrl(request: Request) {
  const origin = process.env.APP_URL?.replace(/\/+$/, "") || new URL(request.url).origin;
  return `${origin}/api/scim/v2`;
}

export async function findScimUser(id: string) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
}

export async function listScimUsers(filter: string | null, startIndex: number, count: number) {
  let where: Record<string, unknown> = { deletedAt: null };
  if (filter) {
    const m = filter.match(/^\s*(userName|externalId|emails\.value)\s+eq\s+"([^"]*)"\s*$/i);
    if (!m) throw new Error("unsupported filter");
    where =
      m[1].toLowerCase() === "externalid"
        ? { ...where, employeeCode: m[2] }
        : { ...where, email: m[2].toLowerCase() };
  }
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: userInclude, orderBy: { createdAt: "asc" }, skip: startIndex - 1, take: count }),
  ]);
  return { total, rows };
}

export function listResponse(rows: UserRow[], total: number, startIndex: number, base: string) {
  return {
    schemas: [LIST],
    totalResults: total,
    startIndex,
    itemsPerPage: rows.length,
    Resources: rows.map((r) => toScim(r, base)),
  };
}

async function resolve(p: Parsed) {
  const [department, jobTitle, manager] = await Promise.all([
    p.department ? prisma.department.findFirst({ where: { OR: [{ name: p.department }, { code: p.department }] } }) : null,
    p.title ? prisma.jobTitle.findFirst({ where: { name: p.title } }) : null,
    p.manager
      ? prisma.user.findFirst({ where: { OR: [{ id: p.manager }, { employeeCode: p.manager }], deletedAt: null } })
      : null,
  ]);
  return {
    // Stated but unknown here clears the link rather than keeping a stale one.
    ...(p.department !== undefined ? { departmentId: department?.id ?? null } : {}),
    ...(p.title !== undefined ? { jobTitleId: jobTitle?.id ?? null } : {}),
    ...(p.manager !== undefined ? { managerId: manager?.id ?? null } : {}),
  };
}

export class ScimConflict extends Error {}
/** A request we can explain; anything else is answered generically. */
export class ScimInvalid extends Error {}

/** Creates a user, or brings back one an earlier DELETE removed. */
export async function createScimUser(p: Parsed) {
  if (!p.email || !p.fullName) throw new ScimInvalid("userName (an email) and a name are required");
  const employeeCode = p.employeeCode ?? p.email;
  const clash = await prisma.user.findFirst({ where: { OR: [{ email: p.email }, { employeeCode }] } });
  // A removed account comes back only when both identifiers are its own: a
  // reused mailbox or employee number must not inherit someone else's record.
  if (clash && (!clash.deletedAt || clash.email !== p.email || clash.employeeCode !== employeeCode)) {
    throw new ScimConflict("A user with this userName or employee number already exists");
  }

  const links = await resolve(p);
  const data = {
    email: p.email,
    fullName: p.fullName,
    employeeCode,
    status: p.active === false ? "INACTIVE" : "ACTIVE",
    ...(p.language ? { preferredLanguage: p.language } : {}),
    ...links,
  };
  // No usable password, and nothing the registration page would let someone
  // else claim: people sign in with SSO, or set a password through "forgot
  // password", which proves they hold the mailbox HR gave us.
  const fresh = {
    passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
    mustChangePassword: false,
    failedLoginCount: 0,
    lockedUntil: null,
  };
  const user = clash
    ? await prisma.user.update({ where: { id: clash.id }, data: { ...data, ...fresh, deletedAt: null } })
    : await prisma.user.create({ data: { ...data, ...fresh } });

  // A returning person starts as an employee; any wider role is granted again
  // by an administrator, not carried over from before they left.
  if (clash) await prisma.userRole.deleteMany({ where: { userId: user.id } });
  const employee = await prisma.role.findUnique({ where: { key: "EMPLOYEE" } });
  if (employee) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: employee.id } },
      update: {},
      create: { userId: user.id, roleId: employee.id },
    });
  }
  await prisma.employeeProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  await audit({ actorName: ACTOR, action: clash ? "SCIM_USER_RESTORED" : "SCIM_USER_CREATED", entity: "User", entityId: user.id, summary: p.email });
  return findScimUser(user.id);
}

export async function updateScimUser(id: string, p: Parsed) {
  const existing = await findScimUser(id);
  if (!existing) return null;
  if (p.email && p.email !== existing.email && (await prisma.user.findUnique({ where: { email: p.email } }))) {
    throw new ScimConflict("Another user already has this userName");
  }
  if (p.employeeCode && p.employeeCode !== existing.employeeCode && (await prisma.user.findUnique({ where: { employeeCode: p.employeeCode } }))) {
    throw new ScimConflict("Another user already has this employee number");
  }

  const links = await resolve(p);
  const leaving = p.active === false && existing.status === "ACTIVE";
  await prisma.user.update({
    where: { id },
    data: {
      ...(p.email ? { email: p.email } : {}),
      ...(p.fullName ? { fullName: p.fullName } : {}),
      ...(p.employeeCode ? { employeeCode: p.employeeCode } : {}),
      ...(p.active !== undefined ? { status: p.active ? "ACTIVE" : "INACTIVE" } : {}),
      ...(p.language ? { preferredLanguage: p.language } : {}),
      ...links,
    },
  });
  if (leaving) await revokeSessions(id);
  await audit({
    actorName: ACTOR,
    action: leaving ? "SCIM_USER_DEACTIVATED" : "SCIM_USER_UPDATED",
    entity: "User",
    entityId: id,
    summary: existing.email,
  });
  return findScimUser(id);
}

/** DELETE: deactivated and hidden from SCIM, never erased. */
export async function removeScimUser(id: string) {
  const existing = await findScimUser(id);
  if (!existing) return false;
  await prisma.user.update({ where: { id }, data: { status: "INACTIVE", deletedAt: new Date() } });
  await revokeSessions(id);
  await audit({ actorName: ACTOR, action: "SCIM_USER_REMOVED", entity: "User", entityId: id, summary: existing.email });
  return true;
}

async function revokeSessions(userId: string) {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export { PATCH as PATCH_SCHEMA };
