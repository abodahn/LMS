"use client";

import { enqueue, pending, remove, recordAttempt, clearAll, GIVE_UP_AFTER } from "./offline-queue";

/**
 * Replaying what was queued while offline.
 *
 * The server action is passed in rather than imported, because this module is
 * shared and the action belongs to one route group — and because a test can
 * then drive the whole thing without a network.
 *
 * A replayed write is idempotent by construction: `saveLessonProgressAction`
 * upserts progress and adds elapsed seconds against a lesson, so replaying one
 * twice cannot produce a second completion. That property is what makes
 * "retry until it sticks" safe here; a queue of, say, payments would need
 * something stronger.
 */

export type SaveResult = { error?: string; success?: string };
export type SaveFn = (payload: Record<string, unknown>) => Promise<SaveResult>;

/** A failure that means "no network", as opposed to "the server said no". */
function isOffline(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  // Server actions surface a transport failure as a TypeError from fetch.
  return error instanceof TypeError;
}

/**
 * Saves now, or queues for later.
 *
 * Returns whether the write reached the server, so the caller can tell the
 * learner the truth — "saved" and "saved on this device" are different promises
 * and it is worth not blurring them.
 */
export async function saveOrQueue(
  save: SaveFn,
  payload: Record<string, unknown>,
  userId: string,
): Promise<{ delivered: boolean; error?: string }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue({ kind: "lessonProgress", payload, userId });
    return { delivered: false };
  }

  try {
    const result = await save(payload);
    // A validation error is the server's considered answer; queueing it would
    // only replay the same rejection forever.
    if (result.error) return { delivered: true, error: result.error };
    return { delivered: true };
  } catch (error) {
    if (!isOffline(error)) throw error;
    await enqueue({ kind: "lessonProgress", payload, userId });
    return { delivered: false };
  }
}

/** Sends everything queued for this user. Returns how many got through. */
export async function replay(save: SaveFn, userId: string): Promise<{ sent: number; left: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { sent: 0, left: (await pending(userId)).length };
  }

  const queue = await pending(userId);
  let sent = 0;

  for (const entry of queue) {
    try {
      const result = await save(entry.payload);
      if (result.error) {
        // The server rejected it on its merits. Retrying will not help, but
        // give it a few goes in case the cause was transient state.
        await recordAttempt(entry);
        if (entry.attempts + 1 >= GIVE_UP_AFTER && entry.id != null) await remove(entry.id);
        continue;
      }
      if (entry.id != null) await remove(entry.id);
      sent++;
    } catch (error) {
      // Still offline — stop, keep the rest, try again next time.
      if (isOffline(error)) break;
      await recordAttempt(entry);
      if (entry.attempts + 1 >= GIVE_UP_AFTER && entry.id != null) await remove(entry.id);
    }
  }

  return { sent, left: (await pending(userId)).length };
}

export { clearAll as clearOfflineQueue, pending as pendingWrites };
