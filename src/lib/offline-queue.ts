/**
 * A durable queue for writes made while offline.
 *
 * The failure this exists for: an employee finishes a lesson standing in a part
 * of the factory with no signal, the save fails, and the work is gone. Nobody
 * does that twice. So a save that cannot reach the server is written to
 * IndexedDB instead and replayed when the connection returns — on the next
 * `online` event, and again on the next page load, because a phone that was
 * simply switched off never fires `online` at all.
 *
 * IndexedDB rather than localStorage because this must survive the tab being
 * killed mid-write, and localStorage offers no such guarantee.
 *
 * Deliberately not Background Sync: Safari does not implement it, and a good
 * half of the phones this runs on are iPhones. Replaying from the page works
 * everywhere and is easier to reason about.
 */

const DB_NAME = "tcai-offline";
const STORE = "queue";
const DB_VERSION = 1;

export type QueuedWrite = {
  id?: number;
  /** What to replay. Kept narrow on purpose — see `replay` in offline-sync.ts. */
  kind: "lessonProgress";
  payload: Record<string, unknown>;
  /** Who queued it, so another user's device never replays it. */
  userId: string;
  queuedAt: number;
  attempts: number;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const tx = <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );

export async function enqueue(entry: Omit<QueuedWrite, "id" | "queuedAt" | "attempts">): Promise<void> {
  await tx("readwrite", (store) =>
    store.add({ ...entry, queuedAt: Date.now(), attempts: 0 } satisfies Omit<QueuedWrite, "id">),
  );
}

export async function pending(userId: string): Promise<QueuedWrite[]> {
  const all = await tx<QueuedWrite[]>("readonly", (store) => store.getAll() as IDBRequest<QueuedWrite[]>);
  return all.filter((entry) => entry.userId === userId).sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function remove(id: number): Promise<void> {
  await tx("readwrite", (store) => store.delete(id) as unknown as IDBRequest<undefined>);
}

export async function recordAttempt(entry: QueuedWrite): Promise<void> {
  if (entry.id == null) return;
  await tx("readwrite", (store) =>
    store.put({ ...entry, attempts: entry.attempts + 1 }) as unknown as IDBRequest<IDBValidKey>,
  );
}

/** Everything, for sign-out: one person's queue must not follow another onto a shared phone. */
export async function clearAll(): Promise<void> {
  await tx("readwrite", (store) => store.clear() as unknown as IDBRequest<undefined>);
}

/**
 * Give up on a write that keeps failing.
 *
 * A payload the server rejects — a deleted lesson, a revoked enrolment — would
 * otherwise be retried on every page load for the life of the device.
 */
export const GIVE_UP_AFTER = 10;
