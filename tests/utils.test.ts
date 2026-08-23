import { describe, expect, it } from "vitest";
import {
  clamp,
  computeStreak,
  formatHours,
  initials,
  parseJson,
  seededShuffle,
  slugify,
  todayKey,
} from "@/lib/utils";
import { translate } from "@/lib/i18n";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import tr from "@/messages/tr.json";

describe("formatHours", () => {
  it("renders the format used across the app", () => {
    expect(formatHours(34.5)).toBe("34h 30m");
    expect(formatHours(6)).toBe("6h");
    expect(formatHours(0.5)).toBe("30m");
    expect(formatHours(0)).toBe("0m");
    expect(formatHours(-3)).toBe("0m");
  });
});

describe("misc helpers", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("slugifies", () => {
    expect(slugify("AI For Everyone!")).toBe("ai-for-everyone");
    expect(slugify("  Spaces  &  Symbols  ")).toBe("spaces-symbols");
  });

  it("builds initials from a name", () => {
    expect(initials("Ahmed Elgohary")).toBe("AE");
    expect(initials("Omar")).toBe("O");
  });

  it("survives malformed JSON columns", () => {
    expect(parseJson<string[]>("not json", [])).toEqual([]);
    expect(parseJson<string[]>(null, ["fallback"])).toEqual(["fallback"]);
    expect(parseJson<string[]>('["a"]', [])).toEqual(["a"]);
  });

  it("shuffles deterministically for the same seed", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(items, "attempt-1")).toEqual(seededShuffle(items, "attempt-1"));
    expect(seededShuffle(items, "attempt-1")).not.toEqual(items);
    expect([...seededShuffle(items, "attempt-1")].sort()).toEqual(items);
  });
});

describe("learning streak", () => {
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return todayKey(d);
  };

  it("counts consecutive days ending today", () => {
    expect(computeStreak([day(0), day(1), day(2)])).toBe(3);
  });

  it("still counts a streak that ended yesterday", () => {
    expect(computeStreak([day(1), day(2)])).toBe(2);
  });

  it("breaks on a gap", () => {
    expect(computeStreak([day(0), day(2), day(3)])).toBe(1);
  });

  it("is zero when nothing is recent", () => {
    expect(computeStreak([day(5), day(6)])).toBe(0);
    expect(computeStreak([])).toBe(0);
  });
});

describe("translations", () => {
  const flatten = (obj: Record<string, unknown>, prefix = ""): string[] =>
    Object.entries(obj).flatMap(([k, v]) =>
      typeof v === "object" && v !== null
        ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
        : [`${prefix}${k}`],
    );

  it("Arabic and Turkish cover every English key", () => {
    const enKeys = flatten(en).sort();
    expect(flatten(ar).sort()).toEqual(enKeys);
    expect(flatten(tr).sort()).toEqual(enKeys);
  });

  it("substitutes parameters", () => {
    expect(translate(en, "dashboard.greetingMorning", { name: "Ahmed" })).toBe("Good morning, Ahmed");
  });

  it("falls back to English for a missing key rather than showing nothing", () => {
    const partial = { common: {} } as unknown as typeof en;
    expect(translate(partial, "common.save")).toBe("Save");
  });

  it("returns the key itself when nothing matches, never an empty string", () => {
    expect(translate(en, "nope.not.here")).toBe("nope.not.here");
  });
});
