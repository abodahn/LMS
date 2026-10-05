"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  hashToken,
  newResetToken,
  recordLoginAttempt,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { LOCALE_COOKIE } from "@/lib/locale";
import { isLocale } from "@/lib/i18n";
import { sendMail } from "@/lib/mailer";
import { UNCLAIMED_PASSWORD } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { oidcConfig } from "@/lib/oidc";

export type ActionState = { error?: string; success?: string };

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "auth.invalidCredentials" };

  const { identifier, password } = parsed.data;
  const key = identifier.toLowerCase();
  const settings = await getSettings();
  const maxFailed = Number(settings[SETTING_KEYS.MAX_FAILED_LOGINS] ?? 5);
  const lockoutMinutes = Number(settings[SETTING_KEYS.LOCKOUT_MINUTES] ?? 15);
  const sessionHours = Number(settings[SETTING_KEYS.SESSION_HOURS] ?? 12);

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email: key }, { employeeCode: identifier }, { username: key }],
    },
  });

  if (!user) {
    await recordLoginAttempt({ identifier, success: false, reason: "UNKNOWN_USER" });
    return { error: "auth.invalidCredentials" };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await recordLoginAttempt({ identifier, userId: user.id, success: false, reason: "LOCKED" });
    const minutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
    return { error: `auth.accountLocked:${minutes}` };
  }

  if (user.status !== "ACTIVE") {
    await recordLoginAttempt({ identifier, userId: user.id, success: false, reason: "INACTIVE" });
    return { error: "auth.accountInactive" };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil: failed >= maxFailed ? new Date(Date.now() + lockoutMinutes * 60000) : null,
      },
    });
    await recordLoginAttempt({ identifier, userId: user.id, success: false, reason: "BAD_PASSWORD" });
    return { error: "auth.invalidCredentials" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await createSession(user.id, sessionHours);
  await recordLoginAttempt({ identifier, userId: user.id, success: true });
  await audit({ actorId: user.id, actorName: user.fullName, action: "LOGIN", entity: "User", entityId: user.id });

  redirect(user.mustChangePassword ? "/change-password" : "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  // Always answer the same way — never reveal whether an account exists.
  if (!parsed.success) return { success: "auth.resetSent" };

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, deletedAt: null, status: "ACTIVE" },
  });

  if (user) {
    const { token, tokenHash } = newResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60_000) },
    });
    const url = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your T&C AI Academy password",
      text: `Hello ${user.fullName},\n\nUse this link within the next hour to set a new password:\n${url}\n\nIf you did not ask for this, you can ignore this email.`,
    });
    await audit({ actorId: user.id, action: "PASSWORD_RESET_REQUEST", entity: "User", entityId: user.id });
  }

  return { success: "auth.resetSent" };
}

const passwordRule = z
  .string()
  .min(10)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "weak");

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) return { error: "auth.passwordsDoNotMatch" };
  if (!passwordRule.safeParse(password).success) return { error: "auth.passwordTooWeak" };

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return { error: "auth.resetInvalid" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash: await hashPassword(password),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // Any existing sessions are no longer trustworthy.
    prisma.session.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  await audit({ actorId: row.userId, action: "PASSWORD_RESET", entity: "User", entityId: row.userId });
  return { success: "auth.resetSuccess" };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) return { error: "auth.passwordsDoNotMatch" };
  if (!passwordRule.safeParse(password).success) return { error: "auth.passwordTooWeak" };

  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, row.passwordHash))) return { error: "auth.invalidCredentials" };
  // Whoever handed out a temporary password knows it, so keeping it would leave
  // the forced change undone.
  if (await verifyPassword(password, row.passwordHash)) return { error: "auth.passwordUnchanged" };

  // Every other session ends: one opened with the old password, perhaps by
  // someone else, must not carry on once the owner has changed it. This
  // browser gets a fresh one.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password), mustChangePassword: false },
    }),
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  const sessionHours = Number((await getSettings())[SETTING_KEYS.SESSION_HOURS] ?? 12);
  await createSession(user.id, sessionHours);
  await audit({ actorId: user.id, actorName: user.fullName, action: "PASSWORD_CHANGE", entity: "User", entityId: user.id });
  redirect("/");
}

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const current = await getSessionUser();
  if (current) {
    await prisma.user.update({ where: { id: current.id }, data: { preferredLanguage: locale } });
  }
}

/**
 * Registration, for an employee HR has already added.
 *
 * This is activation rather than sign-up. The service is reachable from the
 * public internet, so an open form would let anyone create an account inside
 * the company's HR records; instead a person can only claim an account that
 * already exists on the roster and has never been used. Everyone else is
 * refused, and HR keeps control of who is in the system by controlling the
 * import.
 *
 * The answer is deliberately the same whether the employee id is unknown, the
 * email does not match, or the account has already been claimed. Three
 * different messages would turn this form into a way to test whether a given
 * person works here.
 *
 * What this does NOT prove is that the person filling it in is who they say:
 * an employee id and a work email are both things a colleague knows. That is
 * acceptable for an internal roll-out and is not acceptable for a public URL
 * indefinitely — the fix is to send a one-time link to the address on file,
 * which needs SMTP configured (Admin → Integrations). Until then every attempt,
 * successful or not, is written to the audit log.
 */
const registerSchema = z.object({
  employeeCode: z.string().trim().min(2).max(40),
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
  confirm: z.string(),
});

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    employeeCode: formData.get("employeeCode"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: "auth.registerRefused" };

  const { employeeCode, email, password, confirm } = parsed.data;

  // Slow down anyone walking the employee-id space.
  if (!rateLimit(`register:${employeeCode.toLowerCase()}`, 5, 15 * 60_000)) {
    return { error: "auth.tooManyAttempts" };
  }

  // With single sign-on the identity provider proves who someone is; a form
  // that only checks an employee code and an email address cannot.
  if (oidcConfig()) return { error: "auth.registerUseSso" };

  if (password !== confirm) return { error: "auth.passwordsDoNotMatch" };
  if (!passwordRule.safeParse(password).success) return { error: "auth.passwordTooWeak" };

  const user = await prisma.user.findFirst({
    where: { employeeCode, deletedAt: null },
  });

  // An account can be claimed once, and only while nobody holds a password for
  // it: added without one, and never signed in. Once HR has handed its owner a
  // temporary password — from an import or a reset — the owner signs in with
  // that, and a colleague who knows the employee id and email must not get
  // there first. Never one that was switched off — a leaver is not reinstated
  // by knowing their own email address.
  const claimable =
    !!user &&
    user.status !== "INACTIVE" &&
    user.lastLoginAt === null &&
    user.passwordHash === UNCLAIMED_PASSWORD &&
    user.email.toLowerCase() === email;

  if (!claimable) {
    await audit({
      actorName: employeeCode,
      action: "ACCOUNT_ACTIVATION_REFUSED",
      entity: "User",
      entityId: user?.id ?? null,
      summary: !user
        ? "No such employee id"
        : user.email.toLowerCase() !== email
          ? "Email does not match the roster"
          : "Account has already been activated",
    });
    return { error: "auth.registerRefused" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      // Claimed: they chose this password, so there is nothing to force.
      mustChangePassword: false,
      ...(user.status === "INVITED" ? { status: "ACTIVE" } : {}),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "ACCOUNT_ACTIVATED",
    entity: "User",
    entityId: user.id,
    summary: `${employeeCode} set their own password from the registration page`,
  });

  // Straight in, rather than bouncing them to a login form to retype what they
  // just chose.
  const sessionHours = Number((await getSettings())[SETTING_KEYS.SESSION_HOURS] ?? 12);
  await createSession(user.id, sessionHours);
  await recordLoginAttempt({ identifier: employeeCode, userId: user.id, success: true });
  redirect("/");
}
