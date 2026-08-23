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

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), mustChangePassword: false },
  });
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
