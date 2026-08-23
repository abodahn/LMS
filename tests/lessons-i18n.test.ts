import { describe, expect, it } from "vitest";
import { AI_AT_TC, AI_AT_TC_MODULES, RESPONSIBLE_AI, RESPONSIBLE_AI_MODULES } from "../prisma/seed/internal-core";
import { ROLE_COURSES } from "../prisma/seed/internal-roles";
import { lessonContentI18n } from "../prisma/seed/lessons-i18n";
import { titleI18n } from "../prisma/seed/internal-i18n";

/**
 * The internal curriculum is the part of the catalog T&C actually owns, and the
 * only part where an untranslated lesson leaves an employee staring at English
 * prose with no fallback anywhere else to read. Coverage is asserted rather
 * than trusted.
 */

const COURSES = [
  { code: AI_AT_TC.code, modules: AI_AT_TC_MODULES },
  { code: RESPONSIBLE_AI.code, modules: RESPONSIBLE_AI_MODULES },
  ...ROLE_COURSES.map((r) => ({ code: r.seed.code, modules: r.modules })),
];

const lessons = COURSES.flatMap((c) =>
  c.modules.flatMap((m) => m.lessons.map((l) => ({ course: c.code, module: m.title, lesson: l.title, content: l.content }))),
);

describe("internal curriculum", () => {
  it("covers every course the seed publishes", () => {
    expect(COURSES).toHaveLength(10);
    expect(lessons.length).toBeGreaterThanOrEqual(92);
  });

  it("translates every lesson body into Arabic and Turkish", () => {
    for (const l of lessons) {
      if (!l.content?.trim()) continue;
      const t = lessonContentI18n(l.course, l.lesson);
      expect(t.contentAr?.trim(), `Arabic body missing: ${l.course} :: ${l.lesson}`).toBeTruthy();
      expect(t.contentTr?.trim(), `Turkish body missing: ${l.course} :: ${l.lesson}`).toBeTruthy();
    }
  });

  it("translates every module and lesson title", () => {
    for (const c of COURSES) {
      for (const m of c.modules) {
        const mt = titleI18n(m.title);
        expect(mt.titleAr, `Arabic module title missing: ${m.title}`).toBeTruthy();
        expect(mt.titleTr, `Turkish module title missing: ${m.title}`).toBeTruthy();
        for (const l of m.lessons) {
          const lt = titleI18n(l.title);
          expect(lt.titleAr, `Arabic lesson title missing: ${l.title}`).toBeTruthy();
          expect(lt.titleTr, `Turkish lesson title missing: ${l.title}`).toBeTruthy();
        }
      }
    }
  });

  it("keeps the Markdown structure of each translation", () => {
    // A translation that drops the headings or bullets renders as a wall of
    // text in the player, which is a silent quality regression.
    const structure = (s: string) => ({
      bullets: (s.match(/^- /gm) ?? []).length,
      numbered: (s.match(/^\d+\. /gm) ?? []).length,
      quotes: (s.match(/^> /gm) ?? []).length,
    });

    for (const l of lessons) {
      if (!l.content?.trim()) continue;
      const en = structure(l.content);
      const { contentAr, contentTr } = lessonContentI18n(l.course, l.lesson);
      for (const [lang, text] of [
        ["Arabic", contentAr],
        ["Turkish", contentTr],
      ] as const) {
        if (!text) continue;
        const other = structure(text);
        const where = `${lang}: ${l.course} :: ${l.lesson}`;
        expect(other.bullets, `${where} — bullet count`).toBe(en.bullets);
        expect(other.numbered, `${where} — numbered list count`).toBe(en.numbered);
        expect(other.quotes, `${where} — block quote count`).toBe(en.quotes);
      }
    }
  });
});
