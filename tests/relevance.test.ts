import { describe, expect, it } from "vitest";
import { writtenIn, onTopic } from "../src/lib/import/relevance";

/**
 * These two filters decide what a harvest is allowed to put in the catalogue.
 * The cases below are real failures from the first run: English motivational
 * videos filed under Turkish, and a coaching query that returned teaching
 * content. Both are cheap to reintroduce and expensive to notice by eye once
 * there are a thousand rows.
 */
describe("writtenIn", () => {
  it("keeps Turkish, whether or not it uses the marked letters", () => {
    expect(writtenIn("Veri Analizi Eğitimi | Sıfırdan İleri Seviye", "tr")).toBe(true);
    expect(writtenIn("Excel ile Veri Analizi ve Raporlama", "tr")).toBe(true);
  });

  it("rejects English titles claiming to be Turkish", () => {
    expect(writtenIn("Data Analysis Full Course for Beginners", "tr")).toBe(false);
    expect(writtenIn("What History's Greatest Achievers Can Teach You", "tr")).toBe(false);
  });

  it("requires Arabic script for an Arabic row, and rejects it elsewhere", () => {
    expect(writtenIn("تحليل البيانات باستخدام بايثون", "ar")).toBe(true);
    expect(writtenIn("Data Analysis with Python", "ar")).toBe(false);
    expect(writtenIn("تحليل البيانات", "en")).toBe(false);
  });
});

describe("onTopic", () => {
  const COACHING_TR = "yöneticiler için koçluk ve mentorluk becerileri kursu";
  const DATA_TR = "veri analizi sıfırdan tam kurs gösterge paneli";

  it("matches across inflection", () => {
    expect(onTopic("Yöneticiler için Koçluk Becerileri", COACHING_TR)).toBe(true);
    expect(onTopic("Python Veri Analizi Dersleri", DATA_TR)).toBe(true);
  });

  it("rejects a result that only shares generic course vocabulary", () => {
    expect(onTopic("Kariyer Yapmak - Elinizdeki Yükseliş", COACHING_TR)).toBe(false);
    expect(onTopic("Tam Kurs: Fotoğrafçılık Eğitimi", DATA_TR)).toBe(false);
  });

  it("does not reject everything when the query is all generic words", () => {
    expect(onTopic("Anything at all", "full course tutorial")).toBe(true);
  });
});
