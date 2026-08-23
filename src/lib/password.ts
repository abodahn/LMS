import bcrypt from "bcryptjs";

/**
 * Password hashing, kept apart from the rest of auth.
 *
 * `auth.ts` owns sessions and cookies and is marked `server-only` so it can
 * never be pulled into a client bundle. But hashing is also needed by things
 * that run outside a request — the seeds, the first-boot bootstrap, and the
 * employee importer — and stripping that guard from auth.ts to reach one
 * function would weaken the most security-sensitive module in the app.
 *
 * So the cost factor lives here, in one place, with no I/O and nothing to leak.
 */
export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
