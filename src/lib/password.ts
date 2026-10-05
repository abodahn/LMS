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

/**
 * Stored instead of a hash while nobody holds a password for the account. It
 * matches no password, and it is what lets the person activate the account
 * themselves on the registration page.
 */
export const UNCLAIMED_PASSWORD = "!unclaimed";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/**
 * A temporary password for one person, who must change it at first sign-in:
 * 14 random characters with no look-alikes (I, l, 1, O, 0), then a digit so it
 * meets the password rule.
 */
export function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return `${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}9`;
}

/**
 * Hashes a generated temporary password. bcrypt's cost is there to slow the
 * guessing of passwords people choose; against some 80 random bits it adds
 * nothing, so a lower one keeps an import of thousands to seconds.
 */
export function hashTemporaryPassword(plain: string) {
  return bcrypt.hash(plain, 8);
}
