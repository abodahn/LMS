import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { permissionsForRoles, primaryRole, type PermissionKey } from "./rbac";
import type { Locale } from "./constants";

export const SESSION_COOKIE = "tcai_session";
const BCRYPT_ROUNDS = 12;

export type SessionUser = {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  locale: Locale;
  mustChangePassword: boolean;
  departmentId: string | null;
  departmentName: string | null;
  jobTitle: string | null;
  jobFamily: string;
  isTechnical: boolean;
  managerId: string | null;
  roles: string[];
  role: ReturnType<typeof primaryRole>;
  permissions: PermissionKey[];
  onboardingStep: string;
};

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export function constantTimeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent")?.slice(0, 400) ?? null,
  };
}

export async function createSession(userId: string, hours: number) {
  const token = randomBytes(32).toString("base64url");
  const meta = await requestMeta();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + hours * 3600_000),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: hours * 3600,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(SESSION_COOKIE);
}

/** Cached per request — many server components ask for the current user. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
          department: true,
          jobTitle: true,
          profile: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (!u || u.status !== "ACTIVE" || u.deletedAt) return null;

  const roles = u.roles.map((r) => r.role.key);
  return {
    id: u.id,
    employeeCode: u.employeeCode,
    email: u.email,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    locale: (u.preferredLanguage as Locale) ?? "en",
    mustChangePassword: u.mustChangePassword,
    departmentId: u.departmentId,
    departmentName: u.department?.name ?? null,
    jobTitle: u.jobTitle?.name ?? null,
    jobFamily: u.jobTitle?.jobFamily ?? u.department?.jobFamily ?? "GENERAL",
    isTechnical: u.profile?.isTechnical ?? u.jobTitle?.isTechnical ?? false,
    managerId: u.managerId,
    roles,
    role: primaryRole(roles),
    permissions: [...permissionsForRoles(roles)],
    onboardingStep: u.profile?.onboardingStep ?? "PROFILE",
  };
});

/**
 * Guards redirect rather than throw: an expired session should land on the
 * login screen, not on an error page.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(key: PermissionKey): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.permissions.includes(key)) redirect("/no-access");
  return user;
}

export function can(user: SessionUser | null, key: PermissionKey) {
  return !!user?.permissions.includes(key);
}

// --- login flow helpers ----------------------------------------------------

export async function recordLoginAttempt(input: {
  identifier: string;
  userId?: string | null;
  success: boolean;
  reason?: string;
}) {
  const meta = await requestMeta();
  await prisma.loginAudit.create({
    data: {
      identifier: input.identifier.slice(0, 120),
      userId: input.userId ?? null,
      success: input.success,
      reason: input.reason,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
}

export function newResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: sha256(token) };
}

export const hashToken = sha256;
