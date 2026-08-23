import { describe, expect, it } from "vitest";
import { list, matchDifficulty, matchLevel, parseHours, uniqueSlug } from "../src/lib/import/parse";

/**
 * Duration is the field a bulk import most often mangles, and it feeds path
 * assembly directly — a course imported as 2h when it is 20h silently wrecks
 * every 35-hour path it lands in. Provider exports write it a dozen ways.
 */
describe("parseHours", () => {
  it("reads the plain forms", () => {
    expect(parseHours("6")).toBe(6);
    expect(parseHours("6.5")).toBe(6.5);
    expect(parseHours("6h")).toBe(6);
    expect(parseHours("6 hours")).toBe(6);
    expect(parseHours(" 12 Hours ")).toBe(12);
  });

  it("reads hours-and-minutes", () => {
    expect(parseHours("1h 30m")).toBe(1.5);
    expect(parseHours("2h15m")).toBe(2.25);
  });

  it("converts minutes", () => {
    expect(parseHours("90 min")).toBe(1.5);
    expect(parseHours("45 minutes")).toBe(0.75);
    expect(parseHours("30m")).toBe(0.5);
  });

  it("returns null rather than guessing", () => {
    expect(parseHours("")).toBeNull();
    expect(parseHours(undefined)).toBeNull();
    expect(parseHours("self-paced")).toBeNull();
    expect(parseHours("0")).toBeNull();
  });

  it("rejects implausible durations instead of distorting a path", () => {
    expect(parseHours("9999")).toBeNull();
  });
});

describe("multi-value columns", () => {
  it("splits on commas, semicolons and pipes", () => {
    expect(list("PROMPTING, WORKPLACE")).toEqual(["PROMPTING", "WORKPLACE"]);
    expect(list("FIN;HR|IT")).toEqual(["FIN", "HR", "IT"]);
    expect(list("  ")).toEqual([]);
    expect(list(undefined)).toEqual([]);
  });
});

describe("difficulty and level", () => {
  it("reads the words providers actually use, in all three languages", () => {
    expect(matchDifficulty("Beginner")).toBe("BEGINNER");
    expect(matchDifficulty("intro")).toBe("BEGINNER");
    expect(matchDifficulty("Temel")).toBe("BEGINNER");
    expect(matchDifficulty("Intermediate")).toBe("INTERMEDIATE");
    expect(matchDifficulty("İleri")).toBe("ADVANCED");
    expect(matchDifficulty("expert")).toBe("ADVANCED");
    expect(matchDifficulty("")).toBeNull();
    expect(matchDifficulty("whatever")).toBeNull();
  });

  it("reads a level with or without the L", () => {
    expect(matchLevel("L2")).toBe("L2");
    expect(matchLevel("2")).toBe("L2");
    expect(matchLevel("l0")).toBe("L0");
    expect(matchLevel("")).toBeNull();
    expect(matchLevel("beginner")).toBeNull();
  });
});

describe("uniqueSlug", () => {
  it("keeps the code when the title is too long to fit", () => {
    const title = "a".repeat(200);
    const slug = uniqueSlug(title, "YT-dQw4w9WgXcQ", new Set());
    expect(slug.endsWith("-yt-dqw4w9wgxcq")).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(120);
  });

  it("separates two long titles that truncate to the same prefix", () => {
    const used = new Set<string>();
    const shared = "the complete artificial intelligence course for absolute beginners in the workplace ".repeat(2);
    const a = uniqueSlug(shared, "YT-aaaaaaaaaaa", used);
    const b = uniqueSlug(shared, "YT-bbbbbbbbbbb", used);
    expect(a).not.toBe(b);
  });

  it("disambiguates codes that differ only in case", () => {
    const used = new Set<string>();
    const a = uniqueSlug("Intro", "YT-aBcDeFgHiJk", used);
    const b = uniqueSlug("Intro", "YT-abcdefghijk", used);
    expect(a).not.toBe(b);
  });

  it("lets a re-imported course keep the slug it already has", () => {
    const own = uniqueSlug("Intro to AI", "YT-abcdefghijk", new Set());
    const again = uniqueSlug("Intro to AI", "YT-abcdefghijk", new Set([own]), own);
    expect(again).toBe(own);
  });
});
