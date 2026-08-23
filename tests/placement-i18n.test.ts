import { describe, expect, it } from "vitest";
import { PLACEMENT_QUESTIONS } from "../prisma/seed/questions-placement";
import { NATIVE_LANGUAGE_COURSES, ARABIC_COURSES, TURKISH_COURSES } from "../prisma/seed/courses-ar-tr";
import { EXTENDED_COURSES } from "../prisma/seed/courses-extended";
import { ALL_QUESTIONS } from "../prisma/seed/assessments";
import { questionI18n } from "../prisma/seed/questions-i18n";
import { EXTERNAL_COURSES } from "../prisma/seed/courses";

/**
 * A question an employee cannot read measures nothing, and a course they
 * cannot follow teaches nothing. Both are content problems that only show up
 * for the people least able to report them, so they are asserted here.
 */

describe("placement assessment", () => {
  it("is entirely made of easy questions", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.difficulty, q.text).toBe("EASY");
    }
  });

  it("lives in its own bank so it cannot leak into the final exam", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.bank, q.text).toBe("BANK_PLACEMENT");
    }
  });

  it("has every question written in English, Arabic and Turkish", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.textAr?.trim(), `Arabic missing: ${q.text}`).toBeTruthy();
      expect(q.textTr?.trim(), `Turkish missing: ${q.text}`).toBeTruthy();
    }
  });

  it("has every answer option written in all three languages", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      for (const o of q.options) {
        expect(o.textAr?.trim(), `Arabic option missing: ${q.text} / ${o.text}`).toBeTruthy();
        expect(o.textTr?.trim(), `Turkish option missing: ${q.text} / ${o.text}`).toBeTruthy();
      }
    }
  });

  it("gives every question exactly one correct answer", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      const correct = q.options.filter((o) => o.isCorrect).length;
      expect(correct, q.text).toBe(1);
    }
  });

  it("keeps stems short enough to read quickly", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.text.split(/\s+/).length, q.text).toBeLessThanOrEqual(32);
    }
  });

  it("holds enough questions per competency for the 20-question paper", () => {
    // FUNDAMENTALS 4 · WORKPLACE 5 · PROMPTING 5 · RESPONSIBLE_AI 4 · DATA 2
    const required: Record<string, number> = {
      FUNDAMENTALS: 4,
      WORKPLACE: 5,
      PROMPTING: 5,
      RESPONSIBLE_AI: 4,
      DATA_AUTOMATION: 2,
    };
    for (const [competency, needed] of Object.entries(required)) {
      const available = PLACEMENT_QUESTIONS.filter((q) => q.competency === competency).length;
      expect(available, competency).toBeGreaterThanOrEqual(needed);
    }
  });
});

describe("every question bank", () => {
  // Inline translation on the seed, or the shared table — either counts.
  const arabic = (text: string, inline?: string) => inline ?? questionI18n(text).textAr;
  const turkish = (text: string, inline?: string) => inline ?? questionI18n(text).textTr;

  it("has an Arabic and a Turkish version of every question", () => {
    for (const q of ALL_QUESTIONS) {
      expect(arabic(q.text, q.textAr), `Arabic missing: ${q.text}`).toBeTruthy();
      expect(turkish(q.text, q.textTr), `Turkish missing: ${q.text}`).toBeTruthy();
    }
  });

  it("has an Arabic and a Turkish version of every answer option", () => {
    for (const q of ALL_QUESTIONS) {
      for (const o of q.options) {
        expect(arabic(o.text, o.textAr), `Arabic option missing: ${o.text}`).toBeTruthy();
        expect(turkish(o.text, o.textTr), `Turkish option missing: ${o.text}`).toBeTruthy();
      }
    }
  });
});

describe("trilingual catalog", () => {
  const all = [...EXTERNAL_COURSES, ...NATIVE_LANGUAGE_COURSES, ...EXTENDED_COURSES];

  it("offers courses actually taught in Arabic and in Turkish", () => {
    expect(ARABIC_COURSES.every((c) => c.language === "ar")).toBe(true);
    expect(TURKISH_COURSES.every((c) => c.language === "tr")).toBe(true);
    expect(ARABIC_COURSES.length).toBeGreaterThanOrEqual(3);
    expect(TURKISH_COURSES.length).toBeGreaterThanOrEqual(3);
  });

  it("covers the first two learning phases in every language", () => {
    // A learner must be able to start (FOUNDATIONS) and then practise
    // (GENERATIVE_AI / PROMPTING) without switching language.
    for (const language of ["en", "ar", "tr"]) {
      const inLanguage = all.filter((c) => (c.language ?? "en") === language && !c.isTechnical);
      expect(inLanguage.some((c) => c.category === "FOUNDATIONS"), `${language}: no foundation course`).toBe(true);
      expect(
        inLanguage.some((c) => c.category === "PROMPTING" || c.category === "GENERATIVE_AI"),
        `${language}: nothing to practise on`,
      ).toBe(true);
    }
  });

  it("names every course in all three languages", () => {
    for (const c of all) {
      expect(c.titleAr?.trim(), `Arabic title missing: ${c.code}`).toBeTruthy();
      expect(c.titleTr?.trim(), `Turkish title missing: ${c.code}`).toBeTruthy();
    }
  });

  it("describes every course in all three languages", () => {
    for (const c of all) {
      expect(c.descriptionAr?.trim(), `Arabic description missing: ${c.code}`).toBeTruthy();
      expect(c.descriptionTr?.trim(), `Turkish description missing: ${c.code}`).toBeTruthy();
    }
  });

  it("states the learning outcomes of every native-language course in all three languages", () => {
    for (const c of NATIVE_LANGUAGE_COURSES) {
      expect(c.descriptionAr?.trim(), `Arabic description missing: ${c.code}`).toBeTruthy();
      expect(c.descriptionTr?.trim(), `Turkish description missing: ${c.code}`).toBeTruthy();
      expect(c.outcomesAr?.length, `Arabic outcomes missing: ${c.code}`).toBe(c.outcomes.length);
      expect(c.outcomesTr?.length, `Turkish outcomes missing: ${c.code}`).toBe(c.outcomes.length);
    }
  });

  it("declares its own language among its available languages", () => {
    for (const c of NATIVE_LANGUAGE_COURSES) {
      expect(c.subtitles ?? [], c.code).toContain(c.language);
    }
  });

  it("uses a unique code and slug per course", () => {
    expect(new Set(all.map((c) => c.code)).size).toBe(all.length);
    expect(new Set(all.map((c) => c.slug)).size).toBe(all.length);
  });
});
