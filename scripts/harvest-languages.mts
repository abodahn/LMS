/**
 * Harvests language courses.
 *
 *   npx tsx scripts/harvest-languages.mts            # writes data/catalog-languages.csv
 *   npx tsx scripts/harvest-languages.mts --import
 *
 * T&C runs production in Egypt and an office in Istanbul, so the languages that
 * matter here are not an abstract list: Arabic speakers need Turkish, Turkish
 * speakers need Arabic, and everyone benefits from business English. Section 6
 * of the brief asks for a Languages category with levels; this fills it, with
 * the pairs T&C actually uses first.
 *
 * **The instruction language is not the language being taught.** A course
 * teaching Turkish to Arabic speakers is delivered *in Arabic* — an Arabic
 * speaker must find it when they filter the catalogue to Arabic, and it is
 * useless to a Turkish speaker. So `Language` is the language of instruction,
 * and the language being learned is named in the title and the description.
 * Getting this backwards would put every Turkish course out of reach of exactly
 * the people who need it.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { COURSE_IMPORT_COLUMNS } from "../src/lib/import/courses";
import { searchWithRetry, verify, pool, sleep, type HarvestLanguage } from "../src/lib/import/youtube-search";
import { writtenIn } from "../src/lib/import/relevance";

type Pair = {
  /** The language the teaching happens in — what a learner filters on. */
  speaks: HarvestLanguage;
  /** The language being learned. */
  learns: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  /** Beginner, Conversation, Business — the brief's own bands. */
  band: string;
  query: string;
  /** What the catalogue says this course is, in all three languages. */
  blurb: { en: string; ar: string; tr: string };
};

const PAIRS: Pair[] = [
  // --- Turkish, for the Arabic speakers who work with Istanbul --------------
  {
    speaks: "ar",
    learns: "Turkish",
    level: "BEGINNER",
    band: "Beginner",
    query: "تعلم اللغة التركية من الصفر للمبتدئين كورس كامل",
    blurb: {
      en: "Turkish from the beginning, taught in Arabic: the alphabet, greetings, and enough to get through a first conversation.",
      ar: "التركية من البداية بشرح عربي: الحروف والتحيات وما يكفي لإتمام محادثة أولى.",
      tr: "Arapça anlatımla sıfırdan Türkçe: alfabe, selamlaşma ve ilk sohbeti geçirmeye yetecek kadarı.",
    },
  },
  {
    speaks: "ar",
    learns: "Turkish",
    level: "INTERMEDIATE",
    band: "Conversation",
    query: "محادثة باللغة التركية جمل يومية شرح بالعربي",
    blurb: {
      en: "Everyday Turkish conversation explained in Arabic — the sentences that actually come up at work and in the street.",
      ar: "محادثة تركية يومية بشرح عربي — الجمل التي تتكرر فعلًا في العمل وفي الشارع.",
      tr: "Arapça açıklamalı günlük Türkçe konuşma — işte ve sokakta gerçekten geçen cümleler.",
    },
  },
  {
    speaks: "ar",
    learns: "Turkish",
    level: "INTERMEDIATE",
    band: "Intermediate",
    query: "قواعد اللغة التركية شرح بالعربي المستوى المتوسط",
    blurb: {
      en: "Turkish grammar in Arabic: cases, tenses and the suffix system that makes the language work.",
      ar: "قواعد التركية بالعربي: الحالات والأزمنة ونظام اللواحق الذي تقوم عليه اللغة.",
      tr: "Arapça anlatımla Türkçe dil bilgisi: durumlar, zamanlar ve dili işleten ek sistemi.",
    },
  },
  // --- Turkish, in English ---------------------------------------------------
  {
    speaks: "en",
    learns: "Turkish",
    level: "BEGINNER",
    band: "Beginner",
    query: "learn Turkish for beginners full course",
    blurb: {
      en: "Turkish from zero in English: pronunciation, essential phrases and the basics of sentence structure.",
      ar: "التركية من الصفر بالإنجليزية: النطق والعبارات الأساسية وبنية الجملة.",
      tr: "İngilizce anlatımla sıfırdan Türkçe: telaffuz, temel ifadeler ve cümle yapısının esasları.",
    },
  },
  {
    speaks: "en",
    learns: "Turkish",
    level: "INTERMEDIATE",
    band: "Conversation",
    query: "Turkish conversation practice for intermediate learners",
    blurb: {
      en: "Turkish conversation practice for people who have the basics and need to actually speak.",
      ar: "تدريب محادثة تركية لمن أتقن الأساسيات ويحتاج أن يتكلم فعليًا.",
      tr: "Temelleri olan ve artık konuşması gereken kişiler için Türkçe konuşma pratiği.",
    },
  },
  // --- Arabic, for Turkish colleagues ---------------------------------------
  {
    speaks: "tr",
    learns: "Arabic",
    level: "BEGINNER",
    band: "Beginner",
    query: "sıfırdan Arapça öğrenme dersleri tam kurs",
    blurb: {
      en: "Arabic from the beginning, taught in Turkish — the alphabet and the phrases that open a conversation.",
      ar: "العربية من البداية بشرح تركي — الحروف والعبارات التي تفتح المحادثة.",
      tr: "Türkçe anlatımla sıfırdan Arapça — alfabe ve sohbeti başlatan ifadeler.",
    },
  },
  // --- Business English, which every site needs -----------------------------
  {
    speaks: "ar",
    learns: "English",
    level: "BEGINNER",
    band: "Beginner",
    query: "تعلم اللغة الانجليزية من الصفر كورس كامل للمبتدئين",
    blurb: {
      en: "English from the beginning, taught in Arabic.",
      ar: "الإنجليزية من البداية بشرح عربي.",
      tr: "Arapça anlatımla sıfırdan İngilizce.",
    },
  },
  {
    speaks: "ar",
    learns: "English",
    level: "INTERMEDIATE",
    band: "Business",
    query: "اللغة الانجليزية للعمل ايميلات واجتماعات شرح بالعربي",
    blurb: {
      en: "Business English in Arabic: email, meetings and the phrasing that carries weight with a buyer.",
      ar: "الإنجليزية للعمل بشرح عربي: البريد والاجتماعات والصياغة التي يقدّرها العميل.",
      tr: "Arapça anlatımla iş İngilizcesi: e-posta, toplantılar ve alıcıya ağırlık taşıyan ifade.",
    },
  },
  {
    speaks: "tr",
    learns: "English",
    level: "INTERMEDIATE",
    band: "Business",
    query: "iş İngilizcesi e-posta ve toplantı İngilizcesi kursu",
    blurb: {
      en: "Business English taught in Turkish: correspondence, meetings and negotiation language.",
      ar: "الإنجليزية للعمل بشرح تركي: المراسلات والاجتماعات ولغة التفاوض.",
      tr: "Türkçe anlatımla iş İngilizcesi: yazışma, toplantı ve müzakere dili.",
    },
  },
  {
    speaks: "en",
    learns: "English",
    level: "INTERMEDIATE",
    band: "Business",
    query: "business English writing emails and meetings course",
    blurb: {
      en: "Business English: writing that gets read, and meeting language that keeps a room moving.",
      ar: "إنجليزية الأعمال: كتابة تُقرأ فعلًا، ولغة اجتماعات تُبقي النقاش يتقدّم.",
      tr: "İş İngilizcesi: okunan yazı ve toplantıyı ilerleten dil.",
    },
  },
];

const PER_PAIR = Number(
  process.argv[process.argv.indexOf("--per") + 1] && process.argv.includes("--per")
    ? process.argv[process.argv.indexOf("--per") + 1]
    : 10,
);

const seen = new Set<string>();
const rows: Record<string, string>[] = [];

for (const pair of PAIRS) {
  const found = await searchWithRetry(pair.query, pair.speaks);
  await sleep(1200 + Math.floor(Math.random() * 900));

  // Same language check as the topic harvest: hl/gl set the interface, not the
  // language of the results, and a course "in Arabic" whose title is English is
  // not in Arabic.
  const relevant = found.filter((c) => !seen.has(c.videoId) && writtenIn(c.title, pair.speaks));
  const fresh = relevant.slice(0, PER_PAIR);
  const checked = await pool(fresh, 6, async (c) => ({ c, ok: await verify(c.videoId) }));

  let kept = 0;
  for (const { c, ok } of checked) {
    if (!ok || seen.has(c.videoId)) continue;
    seen.add(c.videoId);
    kept++;

    const hours = Math.max(0.25, Math.round((c.seconds / 3600) * 10) / 10);
    const by = {
      en: `Presented by ${ok.channel} on YouTube.`,
      ar: `مقدَّم من ${ok.channel} على يوتيوب.`,
      tr: `${ok.channel} tarafından YouTube'da sunulmaktadır.`,
    };

    rows.push({
      Code: `LNG-${c.videoId}`,
      Title: ok.title.slice(0, 200),
      URL: `https://www.youtube.com/watch?v=${c.videoId}`,
      Provider: ok.channel.slice(0, 120),
      Platform: "YouTube",
      // The taught language leads the description, because the title is in the
      // language of instruction and does not always say what is being learned.
      Description: `${pair.learns} · ${pair.band}. ${pair.blurb.en} ${by.en}`.slice(0, 4000),
      "Description AR": `${pair.learns} · ${pair.band}. ${pair.blurb.ar} ${by.ar}`.slice(0, 4000),
      "Description TR": `${pair.learns} · ${pair.band}. ${pair.blurb.tr} ${by.tr}`.slice(0, 4000),
      // Instruction language, not the language being taught. See the note above.
      Language: pair.speaks,
      Level: "L1",
      Difficulty: pair.level,
      Hours: String(hours),
      Free: "yes",
      Price: "0",
      Certificate: "no",
      Category: "LANGUAGES",
      // Language is everyone's, so no job family and no AI competency: these
      // should never crowd out the AI path the engine is assembling.
      Technical: "no",
    });
  }
  console.log(`  ${pair.speaks} → ${pair.learns} (${pair.band}): ${found.length} found → ${kept} kept`);
}

const csv = [
  COURSE_IMPORT_COLUMNS.join(","),
  ...rows.map((r) =>
    COURSE_IMPORT_COLUMNS.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","),
  ),
].join("\n");

mkdirSync("data", { recursive: true });
writeFileSync("data/catalog-languages.csv", "﻿" + csv, "utf8");

const byLearns = new Map<string, number>();
for (const r of rows) {
  const learns = r.Description.split(" · ")[0];
  byLearns.set(learns, (byLearns.get(learns) ?? 0) + 1);
}
console.log(`\nwrote data/catalog-languages.csv: ${rows.length} courses`);
console.log("  teaching: " + [...byLearns].map(([l, n]) => `${l}=${n}`).join("  "));

if (!process.argv.includes("--import")) process.exit(0);

const { validateCourseRows, commitCourseImport } = await import("../src/lib/import/courses");
const preview = await validateCourseRows([...COURSE_IMPORT_COLUMNS], rows);
for (const bad of preview.rows.filter((r) => r.status === "INVALID").slice(0, 5)) {
  console.log(`  invalid line ${bad.line}: ${bad.issues.join("; ")}`);
}
const result = await commitCourseImport(preview, { trustLinks: true });
console.log(`imported: ${result.created} created, ${result.updated} updated, ${result.lessons} lessons`);
