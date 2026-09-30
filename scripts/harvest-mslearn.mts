/**
 * Harvests the Microsoft Learn catalogue.
 *
 *   npx tsx scripts/harvest-mslearn.mts            # writes data/catalog-mslearn.csv
 *   npx tsx scripts/harvest-mslearn.mts --import   # and loads it
 *
 * Microsoft publishes its entire training catalogue as one JSON document per
 * locale — thousands of modules and learning paths with titles, summaries,
 * durations, levels, roles, products and canonical URLs. It is free, it is the
 * vendor's own material, and section 2 of the brief names it as a source.
 *
 * Three things make it worth far more than a scrape:
 *
 *  - it is an API, so nothing here guesses at a URL or invents a description;
 *  - the same content exists in Arabic and Turkish with genuinely translated
 *    titles and summaries, not machine output;
 *  - each locale has its own URL, so a course is imported once per language
 *    rather than once with three titles — an Arabic speaker follows a link to
 *    the Arabic page, which is the whole point.
 *
 * The catalogue is filtered to what a garment manufacturer can use. Kubernetes
 * and game development are dropped; supply chain, manufacturing, finance,
 * security, Excel, Power BI and the AI material are kept, and anything aimed at
 * engineers is tagged technical so the recommendation engine keeps it away from
 * people whose job title says otherwise.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { COURSE_IMPORT_COLUMNS } from "../src/lib/import/courses";

type Locale = "en-us" | "ar-sa" | "tr-tr";
const LOCALES: Record<Locale, "en" | "ar" | "tr"> = { "en-us": "en", "ar-sa": "ar", "tr-tr": "tr" };

type Item = {
  uid: string;
  type: string;
  title: string;
  summary: string;
  url: string;
  duration_in_minutes?: number;
  levels?: string[];
  roles?: string[];
  products?: string[];
  subjects?: string[];
  popularity?: number;
  number_of_children?: number;
};

type Catalog = { modules: Item[]; learningPaths: Item[] };

/**
 * Subjects worth carrying. Everything outside this list is Microsoft teaching
 * its own infrastructure — real training, but not what a garment factory needs.
 */
const SUBJECT_CATEGORY: Record<string, string> = {
  // AI
  "artificial-intelligence": "FOUNDATIONS",
  "machine-learning": "FOUNDATIONS",
  "generative-ai": "GENERATIVE_AI",
  chatbots: "GENERATIVE_AI",
  "natural-language-processing": "GENERATIVE_AI",
  // Data
  "data-analytics": "DATA",
  "data-visualization": "DATA",
  "data-management": "DATA",
  "data-modeling": "DATA",
  "data-integration": "DATA",
  "business-reporting": "DATA",
  databases: "DATA",
  // Everyday work
  "business-applications": "PRODUCTIVITY",
  productivity: "PRODUCTIVITY",
  "process-workflow": "PRODUCTIVITY",
  automation: "PRODUCTIVITY",
  // People
  collaboration: "COMMUNICATION",
  communication: "COMMUNICATION",
  "knowledge-management": "COMMUNICATION",
  "employee-engagement": "LEADERSHIP",
  "employee-management": "LEADERSHIP",
  "change-management": "LEADERSHIP",
  "remote-hybrid-work": "COMMUNICATION",
  // Trust and safety
  security: "RESPONSIBLE_AI",
  compliance: "RESPONSIBLE_AI",
  "information-protection-governance": "RESPONSIBLE_AI",
  "identity-access": "RESPONSIBLE_AI",
  "threat-protection": "RESPONSIBLE_AI",
  "insider-risk": "RESPONSIBLE_AI",
  accessibility: "RESPONSIBLE_AI",
  // The business T&C is actually in
  "finance-accounting": "ROLE_SPECIFIC",
  "supply-chain-management": "ROLE_SPECIFIC",
  "manufacturing-processes": "ROLE_SPECIFIC",
  "inventory-management": "ROLE_SPECIFIC",
  "asset-management": "ROLE_SPECIFIC",
  "product-lifecycle-management": "ROLE_SPECIFIC",
  "field-management": "ROLE_SPECIFIC",
  "customer-relationship-management": "ROLE_SPECIFIC",
  "marketing-sales": "ROLE_SPECIFIC",
  // For T&C's own IT department
  "app-development": "TECHNICAL",
  devops: "TECHNICAL",
  "cloud-computing": "TECHNICAL",
  "it-management-monitoring": "TECHNICAL",
};

const CATEGORY_COMPETENCY: Record<string, string> = {
  FOUNDATIONS: "FUNDAMENTALS:4",
  GENERATIVE_AI: "FUNDAMENTALS:2,WORKPLACE:3",
  DATA: "DATA_AUTOMATION:4",
  PRODUCTIVITY: "WORKPLACE:4",
  COMMUNICATION: "",
  LEADERSHIP: "",
  RESPONSIBLE_AI: "RESPONSIBLE_AI:5",
  ROLE_SPECIFIC: "WORKPLACE:3",
  TECHNICAL: "TECHNICAL:5",
};

/** Roles that mean "written for an engineer". */
const TECHNICAL_ROLES = new Set([
  "developer",
  "devops-engineer",
  "solution-architect",
  "administrator",
  "data-engineer",
  "security-engineer",
  "network-engineer",
  "ai-engineer",
  "ai-edge-engineer",
  "database-administrator",
  "technology-manager",
  "support-engineer",
  "platform-engineer",
]);

const LEVEL_BY_MS: Record<string, string> = { beginner: "L1", intermediate: "L2", advanced: "L4" };
const DIFFICULTY_BY_MS: Record<string, string> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

const categoryOf = (item: Item): string | null => {
  for (const subject of item.subjects ?? []) {
    if (SUBJECT_CATEGORY[subject]) return SUBJECT_CATEGORY[subject];
  }
  return null;
};

async function fetchCatalog(locale: Locale): Promise<Catalog> {
  const res = await fetch(`https://learn.microsoft.com/api/catalog/?locale=${locale}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Microsoft Learn catalog ${locale}: HTTP ${res.status}`);
  return (await res.json()) as Catalog;
}

/** The uid is stable across locales, which is what lets the three be matched up. */
const rowsFor = (catalog: Catalog) => [
  ...catalog.modules.map((m) => ({ ...m, kind: "module" as const })),
  ...catalog.learningPaths.map((p) => ({ ...p, kind: "path" as const })),
];

async function main() {
  const byLocale = new Map<Locale, Map<string, Item & { kind: "module" | "path" }>>();

  for (const locale of Object.keys(LOCALES) as Locale[]) {
    const catalog = await fetchCatalog(locale);
    const index = new Map<string, Item & { kind: "module" | "path" }>();
    for (const item of rowsFor(catalog)) index.set(item.uid, item);
    byLocale.set(locale, index);
    console.log(`  ${locale}: ${index.size} items`);
  }

  const rows: Record<string, string>[] = [];
  let skipped = 0;

  for (const [locale, language] of Object.entries(LOCALES) as [Locale, "en" | "ar" | "tr"][]) {
    const index = byLocale.get(locale)!;

    for (const item of index.values()) {
      const category = categoryOf(item);
      if (!category) {
        if (language === "en") skipped++;
        continue;
      }

      const level = LEVEL_BY_MS[item.levels?.[0] ?? "beginner"] ?? "L2";
      const isTechnical =
        category === "TECHNICAL" || (item.roles ?? []).some((r) => TECHNICAL_ROLES.has(r));

      // A learning path bundles modules, so its hours are the sum Microsoft
      // reports rather than a single sitting.
      const minutes = item.duration_in_minutes ?? (item.kind === "path" ? 120 : 30);

      rows.push({
        // Locale in the code: the same module in three languages is three rows
        // pointing at three different pages.
        Code: `MSL-${language.toUpperCase()}-${item.uid}`.slice(0, 60),
        Title: item.title.slice(0, 200),
        URL: item.url.split("?")[0],
        Provider: "Microsoft Learn",
        Platform: item.kind === "path" ? "Microsoft Learn (learning path)" : "Microsoft Learn",
        Description: (item.summary || item.title).slice(0, 4000),
        Language: language,
        Level: level,
        Difficulty: DIFFICULTY_BY_MS[item.levels?.[0] ?? "beginner"] ?? "INTERMEDIATE",
        Hours: String(Math.max(0.25, Math.round((minutes / 60) * 100) / 100)),
        Free: "yes",
        Price: "0",
        // Modules award a badge on the Microsoft side, not a certificate here.
        Certificate: "no",
        Category: category,
        Competencies: CATEGORY_COMPETENCY[category] ?? "",
        Technical: isTechnical ? "yes" : "no",
      });
    }
  }

  // Written in parts rather than as one file. The importer holds a whole
  // file's parsed rows while it works through it, and ten thousand of those is
  // more than a 512MB container can carry alongside the application itself.
  const PART = 2000;
  mkdirSync("data", { recursive: true });

  for (let i = 0, part = 1; i < rows.length; i += PART, part++) {
    const csv = [
      COURSE_IMPORT_COLUMNS.join(","),
      ...rows
        .slice(i, i + PART)
        .map((r) =>
          COURSE_IMPORT_COLUMNS.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","),
        ),
    ].join("\n");
    writeFileSync(`data/catalog-mslearn-${String(part).padStart(2, "0")}.csv`, "﻿" + csv, "utf8");
  }

  const byLang = new Map<string, number>();
  const byCat = new Map<string, number>();
  for (const r of rows) {
    byLang.set(r.Language, (byLang.get(r.Language) ?? 0) + 1);
    byCat.set(r.Category, (byCat.get(r.Category) ?? 0) + 1);
  }

  console.log(`\nwrote ${Math.ceil(rows.length / 2000)} parts under data/: ${rows.length} courses`);
  console.log("  " + [...byLang].map(([l, n]) => `${l}=${n}`).join("  "));
  console.log("  " + [...byCat].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}=${n}`).join("  "));
  console.log(`  ${skipped} items skipped as not relevant to T&C`);

  if (!process.argv.includes("--import")) return;

  const { validateCourseRows, commitCourseImport } = await import("../src/lib/import/courses");
  const preview = await validateCourseRows([...COURSE_IMPORT_COLUMNS], rows);
  console.log(`\npreview: ${preview.counts.total} rows, ${preview.counts.invalid} invalid`);
  for (const bad of preview.rows.filter((r) => r.status === "INVALID").slice(0, 5)) {
    console.log(`  line ${bad.line}: ${bad.issues.join("; ")}`);
  }
  const result = await commitCourseImport(preview, { trustLinks: true });
  console.log(`imported: ${result.created} created, ${result.updated} updated`);
}

await main();
