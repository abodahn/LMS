import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { acceptableUrl, backoffMinutes, signature } from "@/lib/webhooks";
import { newApiKey, paged } from "@/lib/api-keys";

describe("webhooks", () => {
  it("signs timestamp and body the way a receiver can check", () => {
    const body = '{"event":"course.completed"}';
    const expected = createHmac("sha256", "whsec_x").update(`1700000000.${body}`).digest("hex");
    expect(signature("whsec_x", body, 1700000000)).toBe(`t=1700000000,v1=${expected}`);
  });
  it("backs off and only accepts https outside development", () => {
    expect([1, 2, 3].map(backoffMinutes)).toEqual([2, 4, 8]);
    expect(acceptableUrl("https://hr.example.com/hook")).toBe(true);
    expect(acceptableUrl("ftp://hr.example.com")).toBe(false);
    expect(acceptableUrl("not a url")).toBe(false);
  });
});

describe("api keys", () => {
  it("are random, prefixed, and kept only as a hash", () => {
    const a = newApiKey();
    const b = newApiKey();
    expect(a.raw).toMatch(/^tca_[A-Za-z0-9_-]{32}$/);
    expect(a.raw).not.toBe(b.raw);
    expect(a.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.raw.startsWith(a.prefix)).toBe(true);
  });
  it("pages by cursor", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(paged(rows, 2)).toEqual({ data: [{ id: "a" }, { id: "b" }], nextCursor: "b" });
    expect(paged(rows, 5)).toEqual({ data: rows, nextCursor: null });
  });
});

describe("webhook address check", () => {
  it("refuses this machine, private networks and metadata addresses", async () => {
    const { isPublicAddress } = await import("@/lib/webhooks");
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "not-an-ip"]) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
    for (const ip of ["8.8.8.8", "20.50.2.1", "2606:4700::1111"]) expect(isPublicAddress(ip), ip).toBe(true);
  });
});
