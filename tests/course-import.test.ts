import { describe, expect, it } from "vitest";
import { list, matchDifficulty, matchLevel, parseHours, parseWeighted, uniqueSlug } from "../src/lib/import/parse";

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

describe("parseWeighted", () => {
  it("reads a key with its weight", () => {
    expect(parseWeighted("FUNDAMENTALS:4")).toEqual([{ key: "FUNDAMENTALS", weight: 4 }]);
    expect(parseWeighted("FUNDAMENTALS:2,WORKPLACE:3")).toEqual([
      { key: "FUNDAMENTALS", weight: 2 },
      { key: "WORKPLACE", weight: 3 },
    ]);
  });

  it("accepts a bare key, which is what most files carry", () => {
    expect(parseWeighted("WORKPLACE")).toEqual([{ key: "WORKPLACE", weight: 3 }]);
  });

  it("falls back rather than writing a nonsense weight", () => {
    expect(parseWeighted("WORKPLACE:abc")).toEqual([{ key: "WORKPLACE", weight: 3 }]);
    expect(parseWeighted("WORKPLACE:0")).toEqual([{ key: "WORKPLACE", weight: 3 }]);
    expect(parseWeighted("WORKPLACE:-2")).toEqual([{ key: "WORKPLACE", weight: 3 }]);
  });

  it("ignores empties instead of creating blank keys", () => {
    expect(parseWeighted("")).toEqual([]);
    expect(parseWeighted(undefined)).toEqual([]);
    expect(parseWeighted("FUNDAMENTALS,,WORKPLACE")).toHaveLength(2);
  });
});

import { deriveKind, fillEmpty, normaliseSourceKey, resolveImportStatus } from "../src/lib/import/courses";

/**
 * Governance rules for imported rows. Each was a confirmed defect: a typo'd
 * status publishing straight to employees, new imports all typed COURSE, and
 * the boot refresh writing over an administrator's corrections.
 */
describe("import governance", () => {
  it("publishes only when the Status cell is empty; anything unrecognised goes to review", () => {
    expect(resolveImportStatus(undefined)).toBe("PUBLISHED");
    expect(resolveImportStatus("  ")).toBe("PUBLISHED");
    expect(resolveImportStatus("pending_review")).toBe("PENDING_REVIEW");
    expect(resolveImportStatus("Pending")).toBe("PENDING_REVIEW");
    expect(resolveImportStatus("ARCHIVED")).toBe("PENDING_REVIEW");
    expect(resolveImportStatus("draft")).toBe("DRAFT");
  });

  it("derives type and source the way the migration backfilled them", () => {
    expect(deriveKind({ code: "MSL-EN-x", platform: "Microsoft Learn · learning path", url: null, hours: 5 })).toEqual({
      sourceKey: "MS_LEARN",
      contentType: "PATH",
    });
    expect(deriveKind({ code: "YT-abc", platform: "YouTube", url: "https://www.youtube.com/watch?v=abc", hours: 2 })).toEqual({
      sourceKey: "YOUTUBE",
      contentType: "VIDEO",
    });
    expect(
      deriveKind({ code: "X", platform: "YouTube", url: "https://www.youtube.com/playlist?list=PL1", hours: 3 }).contentType,
    ).toBe("PLAYLIST");
    expect(deriveKind({ code: "X", platform: "Other", url: "https://www.freecodecamp.org/learn/x/", hours: 3 }).sourceKey).toBe(
      "FREECODECAMP",
    );
    expect(deriveKind({ code: "X", platform: "Other", url: null, hours: 0.5 })).toEqual({ sourceKey: null, contentType: "MICRO" });
  });

  it("normalises source keys so case and punctuation cannot defeat a comparison", () => {
    expect(normaliseSourceKey("IBM SkillsBuild")).toBe("IBM_SKILLSBUILD");
    expect(normaliseSourceKey("freecodecamp")).toBe("FREECODECAMP");
    expect(normaliseSourceKey("  ")).toBeNull();
  });

  it("fills only what is missing and never overwrites a value someone set", () => {
    const existing = { titleAr: "عنوان صححه المسؤول", categoryId: null, description: "", estimatedHours: 3 };
    const incoming = { titleAr: "from the file", categoryId: "cat1", description: "from the file", estimatedHours: 9 };
    expect(fillEmpty(existing, incoming)).toEqual({ categoryId: "cat1", description: "from the file" });
  });
});
