/**
 * How much learning a session is worth.
 *
 * Split out of sessions.ts, which reaches the database and the notifier, so the
 * arithmetic that lands hours on somebody's training record can be tested on its
 * own. There is no screen that shows this working — an employee just sees a
 * number go up — so it is worth pinning.
 */
export function creditHours(session: { creditHours: number | null; startsAt: Date; endsAt: Date }): number {
  if (session.creditHours != null) return session.creditHours;
  const hours = (session.endsAt.getTime() - session.startsAt.getTime()) / 3_600_000;
  return Math.max(0, Math.round(hours * 10) / 10);
}
