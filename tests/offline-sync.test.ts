import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The offline queue is the one place in this app where losing a write is
 * silent: the learner sees a tick, walks away, and nobody finds out until they
 * ask why their course is not complete. So the rules are pinned here —
 * especially the distinction between "the network is not there" (hold it) and
 * "the server said no" (do not hold it forever).
 *
 * IndexedDB is not available in the test environment, so the store is faked at
 * the module boundary; what is under test is the decision logic above it.
 */

const store = vi.hoisted(() => ({
  rows: [] as { id: number; payload: Record<string, unknown>; userId: string; queuedAt: number; attempts: number }[],
  nextId: 1,
}));

vi.mock("../src/lib/offline-queue", () => ({
  GIVE_UP_AFTER: 10,
  enqueue: vi.fn(async (entry: { payload: Record<string, unknown>; userId: string }) => {
    store.rows.push({ id: store.nextId++, ...entry, queuedAt: Date.now(), attempts: 0 });
  }),
  pending: vi.fn(async (userId: string) => store.rows.filter((r) => r.userId === userId)),
  remove: vi.fn(async (id: number) => {
    store.rows = store.rows.filter((r) => r.id !== id);
  }),
  recordAttempt: vi.fn(async (entry: { id: number }) => {
    const row = store.rows.find((r) => r.id === entry.id);
    if (row) row.attempts += 1;
  }),
  clearAll: vi.fn(async () => {
    store.rows = [];
  }),
}));

const { saveOrQueue, replay } = await import("../src/lib/offline-sync");

const setOnline = (value: boolean) => {
  vi.stubGlobal("navigator", { onLine: value });
};

beforeEach(() => {
  store.rows = [];
  store.nextId = 1;
  setOnline(true);
});

describe("saveOrQueue", () => {
  it("sends straight through when there is a network", async () => {
    const save = vi.fn(async () => ({ success: "ok" }));
    const result = await saveOrQueue(save, { lessonId: "L1" }, "U1");

    expect(result.delivered).toBe(true);
    expect(save).toHaveBeenCalledOnce();
    expect(store.rows).toHaveLength(0);
  });

  it("holds the write on the device when offline, without calling the server", async () => {
    setOnline(false);
    const save = vi.fn(async () => ({ success: "ok" }));
    const result = await saveOrQueue(save, { lessonId: "L1" }, "U1");

    expect(result.delivered).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(store.rows).toHaveLength(1);
  });

  it("holds it when the request itself fails mid-flight", async () => {
    // Online by the browser's reckoning, but the fetch dies — a dead zone the
    // phone has not noticed yet, which is the common case walking through a
    // building.
    const save = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const result = await saveOrQueue(save, { lessonId: "L1" }, "U1");

    expect(result.delivered).toBe(false);
    expect(store.rows).toHaveLength(1);
  });

  it("does not queue what the server refused on its merits", async () => {
    // A validation error is an answer, not a network problem. Queueing it would
    // replay the same rejection on every page load, forever.
    const save = vi.fn(async () => ({ error: "errors.validation" }));
    const result = await saveOrQueue(save, { lessonId: "gone" }, "U1");

    expect(result.delivered).toBe(true);
    expect(result.error).toBe("errors.validation");
    expect(store.rows).toHaveLength(0);
  });

  it("lets a real programming error surface instead of swallowing it", async () => {
    const save = vi.fn(async () => {
      throw new RangeError("bug");
    });
    await expect(saveOrQueue(save, {}, "U1")).rejects.toThrow(RangeError);
  });
});

describe("replay", () => {
  it("sends what was held and empties the queue", async () => {
    setOnline(false);
    const save = vi.fn(async () => ({ success: "ok" }));
    await saveOrQueue(save, { lessonId: "L1" }, "U1");
    await saveOrQueue(save, { lessonId: "L2" }, "U1");
    expect(store.rows).toHaveLength(2);

    setOnline(true);
    const result = await replay(save, "U1");

    expect(result).toEqual({ sent: 2, left: 0 });
    expect(store.rows).toHaveLength(0);
  });

  it("never replays another person's work on a shared device", async () => {
    setOnline(false);
    const save = vi.fn(async () => ({ success: "ok" }));
    await saveOrQueue(save, { lessonId: "L1" }, "OTHER");

    setOnline(true);
    const result = await replay(save, "U1");

    expect(result.sent).toBe(0);
    expect(save).not.toHaveBeenCalled();
    // Still held for whoever queued it.
    expect(store.rows).toHaveLength(1);
  });

  it("stops at the first network failure and keeps the rest", async () => {
    setOnline(false);
    const queueOnly = vi.fn(async () => ({ success: "ok" }));
    await saveOrQueue(queueOnly, { lessonId: "L1" }, "U1");
    await saveOrQueue(queueOnly, { lessonId: "L2" }, "U1");

    setOnline(true);
    let call = 0;
    const save = vi.fn(async () => {
      if (++call === 2) throw new TypeError("Failed to fetch");
      return { success: "ok" };
    });

    const result = await replay(save, "U1");
    expect(result.sent).toBe(1);
    expect(result.left).toBe(1);
  });

  it("gives up on a write the server keeps refusing", async () => {
    setOnline(false);
    await saveOrQueue(vi.fn(async () => ({ success: "ok" })), { lessonId: "gone" }, "U1");
    setOnline(true);

    const save = vi.fn(async () => ({ error: "errors.notFound" }));
    // Ten attempts is the ceiling; without it a dead payload is retried on
    // every page load for the life of the device.
    for (let i = 0; i < 10; i++) await replay(save, "U1");

    expect(store.rows).toHaveLength(0);
  });

  it("does nothing while still offline", async () => {
    setOnline(false);
    const save = vi.fn(async () => ({ success: "ok" }));
    await saveOrQueue(save, { lessonId: "L1" }, "U1");

    const result = await replay(save, "U1");
    expect(result).toEqual({ sent: 0, left: 1 });
    expect(save).not.toHaveBeenCalled();
  });
});
