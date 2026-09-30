/**
 * The completion rule on its own, with nothing to import.
 *
 * Kept apart from sign-off.ts because the progress path needs only this yes/no,
 * and reaching it through sign-off dragged in notifications, certificates and
 * badges — `server-only` modules — into everything that recalculates progress,
 * including the tests.
 */

/**
 * Whether an enrolment may be marked complete.
 *
 * Exported and pure so the rule lives in one place: it is asked by the progress
 * path, by the sign-off itself, and by anything that shows a learner why their
 * course is still open.
 */
export function canComplete(input: {
  requiresSignOff: boolean;
  progressPercent: number;
  hasSignOff: boolean;
}): { ok: boolean; reason?: "progress" | "awaiting-sign-off" } {
  if (input.progressPercent < 100) return { ok: false, reason: "progress" };
  if (input.requiresSignOff && !input.hasSignOff) return { ok: false, reason: "awaiting-sign-off" };
  return { ok: true };
}
