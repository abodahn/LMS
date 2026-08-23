/**
 * Relevance filters for harvested course listings.
 *
 * A search engine answers every query with something, and YouTube's `hl`/`gl`
 * parameters set the interface language rather than the language of the
 * results. Without these two checks the catalogue fills with English
 * motivational videos filed under Turkish, and a coaching query returns
 * teaching-skills content. Both run on the title, which is the only text a
 * search result reliably carries.
 *
 * Pure string work with no I/O, so it lives here beside the other import
 * parsing rather than inside the harvest script.
 */

export type HarvestLang = "en" | "ar" | "tr";

const ARABIC = /[؀-ۿ]/;
const TURKISH_MARKS = /[ğışçöüĞİŞÇÖÜ]/;
/** Turkish written without any of the marked letters is common enough to need this. */
const TURKISH_WORDS =
  /\b(ve|ile|için|nasıl|nedir|bir|bu|dersleri?|eğitimi?|kursu?|öğren|sıfırdan|anlatım|rehber|temel)\b/i;
// Deliberately excludes English words that collide with Turkish ones — "on"
// is Turkish for ten, "it" and "an" are Turkish words too. The Turkish signal
// above is checked first regardless, so a real Turkish title survives an
// English product name in the middle of it.
const ENGLISH_WORDS =
  /\b(the|you|your|what|how|this|that|these|those|with|from|about|will|they|their|there|our|for|and|of|are|was|were|have|has|been|which|who|why|when|where|into|than|then|make|makes|using|guide|best|every|everything)\b/i;

/** Whether a title is actually written in the language the row claims. */
export function writtenIn(title: string, lang: HarvestLang): boolean {
  const arabic = ARABIC.test(title);
  if (lang === "ar") return arabic;
  if (arabic) return false;

  if (lang === "tr") {
    // Accept on a Turkish signal; reject only when it reads as English instead.
    if (TURKISH_MARKS.test(title) || TURKISH_WORDS.test(title)) return true;
    return !ENGLISH_WORDS.test(title);
  }
  return !TURKISH_MARKS.test(title);
}

/** Words that appear in every course title and so carry no topic at all. */
const GENERIC = new Set([
  "course", "courses", "full", "tutorial", "tutorials", "beginner", "beginners",
  "complete", "learn", "learning", "training", "guide", "introduction", "intro",
  "skills", "explained", "practical", "examples", "workplace", "work",
  "kurs", "kursu", "egitim", "egitimi", "tam", "ders", "dersleri", "sifirdan",
  "anlatim", "baslangic", "teknikleri", "becerileri", "rehber", "nedir", "nasil",
  "icin", "temel",
  "كورس", "دورة", "دورات", "كامل", "كاملة", "شرح", "للمبتدئين", "مساق", "تدريبية",
  "مهارات", "تعلم", "اساسيات", "في", "على", "من",
]);

/** Turkish dotted/dotless I first, or the fold loses the distinction wrongly. */
const fold = (s: string) =>
  s.replace(/[İIı]/g, "i").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/**
 * Whether a title shares a topic word with the query that found it.
 *
 * Matched on a five-character prefix so Turkish and Arabic inflection does not
 * cost a match ("yönetim" against "yöneticiler"), and generic course vocabulary
 * is excluded so the word "course" alone cannot carry an unrelated result
 * through.
 */
export function onTopic(title: string, query: string): boolean {
  const words = fold(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4 && !GENERIC.has(w));
  if (words.length === 0) return true;

  const haystack = fold(title);
  return words.some((w) => haystack.includes(w.slice(0, 5)));
}
