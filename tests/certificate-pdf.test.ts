import { describe, expect, it } from "vitest";
import { isRtl, pieces, visualOrder, wrap } from "@/lib/certificate-pdf";

/** The visual order as text: pieces joined, gaps as single spaces. */
const shown = (t: string) => visualOrder(t).map((i) => ("gap" in i ? " " : i.text)).join("");

describe("certificate text layout", () => {
  it("splits a word into Arabic, Arabic-Indic digit and Latin runs", () => {
    expect(pieces("للمبتدئين:")).toEqual([{ text: "للمبتدئين", kind: "arabic" }, { text: ":", kind: "latin" }]);
    expect(pieces("٢٠٢٦")).toEqual([{ text: "٢٠٢٦", kind: "adigit" }]);
  });
  it("lays right-to-left lines out right to left, keeping numbers and Latin in order", () => {
    // Visual left-to-right: the last word first; "Excel 2026" stays as written.
    expect(shown("دورة Excel 2026 للمبتدئين")).toBe("للمبتدئين Excel 2026 دورة");
    // Punctuation after an Arabic word moves to its left; brackets turn round.
    expect(shown("أساسيات: الذكاء")).toBe("الذكاء :أساسيات");
    expect(shown("(الذكاء)")).toBe("(الذكاء)");
  });
  it("leaves left-to-right lines alone", () => {
    expect(shown("Lean 5S: basics")).toBe("Lean 5S: basics");
    expect(shown("Provided by إدراك")).toBe("Provided by إدراك");
  });
  it("knows which way a line reads", () => {
    expect(isRtl("أساسيات الذكاء")).toBe(true);
    expect(isRtl("2026 أساسيات")).toBe(true);
    expect(isRtl("Excel للمبتدئين")).toBe(false);
    expect(isRtl("Şükrü Yıldırım")).toBe(false);
  });
  it("wraps by words within a width", () => {
    const w = (t: string) => t.length;
    expect(wrap("one two three four", w, 9)).toEqual(["one two", "three", "four"]);
  });
});

describe("certificate names and issuers", async () => {
  const { cleanCertificateName } = await import("@/lib/certificate-settings");
  const { issuerKey } = await import("@/lib/certificate-code");
  it("accepts real names in any script and tidies spaces", () => {
    expect(cleanCertificateName("  Ahmed   Elgohary ")).toBe("Ahmed Elgohary");
    expect(cleanCertificateName("Şükrü Yıldırım")).toBe("Şükrü Yıldırım");
    expect(cleanCertificateName("أحمد الجوهري")).toBe("أحمد الجوهري");
    expect(cleanCertificateName("Mary-Jane O'Neil")).toBe("Mary-Jane O'Neil");
  });
  it("refuses what is not a name", () => {
    for (const bad of ["", "Al", "<script>", "Ahmed 2026", "x".repeat(81), "-Ahmed"]) expect(cleanCertificateName(bad), bad).toBeNull();
  });
  it("knows only the two issuers", () => {
    expect(issuerKey("TCAP")).toBe("TCAP");
    expect(issuerKey("TC")).toBe("TC");
    expect(issuerKey("anything")).toBe("TC");
    expect(issuerKey(null)).toBe("TC");
  });
});

describe("printed names belong to the person", async () => {
  const { cleanCertificateName, matchesRecordedName } = await import("@/lib/certificate-settings");
  const record = { fullName: "Ahmed Elgohary", fullNameAr: "أحمد الجوهري" };
  it("allows the recorded name, its case and accents, and added middle names", () => {
    expect(matchesRecordedName("Ahmed Elgohary", record)).toBe(true);
    expect(matchesRecordedName("AHMED ELGOHARY", record)).toBe(true);
    expect(matchesRecordedName("Ahmed Mohamed Ali Elgohary", record)).toBe(true);
    expect(matchesRecordedName("احمد محمد الجوهري", record)).toBe(true);
  });
  it("refuses someone else's name, dropped words, wrong order and Arabic with none on record", () => {
    expect(matchesRecordedName("Ahmed Tolba", record)).toBe(false);
    expect(matchesRecordedName("Ahmed", record)).toBe(false);
    expect(matchesRecordedName("Elgohary Ahmed", record)).toBe(false);
    expect(matchesRecordedName("أحمد طلبة", record)).toBe(false);
    expect(matchesRecordedName("أحمد الجوهري", { fullName: "Ahmed Elgohary" })).toBe(false);
  });
  it("refuses invisible, mixed-script, unsupported-script and over-accented names", () => {
    for (const bad of ["ㅤㅤㅤ", "Ahmed\u034FTolba", "Аhmed Tolba", "Ahmed أحمد", "דוד כהן", "Ahme\u0301\u0300\u0302\u0303d"]) {
      expect(cleanCertificateName(bad), bad).toBeNull();
    }
  });
});
