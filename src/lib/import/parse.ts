import { LEVEL_CODES } from "../constants";
import { slugify } from "../utils";

/**
 * Pure parsing for spreadsheet imports. No database, no `server-only` — a
 * provider export writes the same field a dozen ways, and the normalising is
 * where the bugs are, so it is kept testable on its own.
 */

/**
 * Case-, space-, dash- and accent-insensitive comparison key.
 *
 * The Turkish dotted capital İ does not lowercase to a plain "i" in JavaScript
 * — it becomes "i" plus a combining dot — so a Turkish provider export would
 * silently fail to match on words like "İleri". Mapping the dotted and dotless
 * i first, then stripping combining marks, makes ç/ğ/ö/ş/ü match their plain
 * forms and Arabic harakat match unvowelled text. Comparison keys only —
 * nothing displayed to anyone passes through here.
 */
export const norm = (s: string) =>
  s
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s_-]+/g, "");

/** "a, b; c" → ["a","b","c"]. Commas, semicolons and pipes all separate. */
export const list = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean);

export const truthy = (value: string | undefined) => /^(y|yes|true|1|free|✓)$/i.test((value ?? "").trim());

/**
 * Accepts "6", "6h", "6 hours", "6.5", "1h 30m", "90 min".
 *
 * Returns null rather than guessing: duration feeds path assembly directly, so
 * a course imported as 2h when it is really 20h quietly wrecks every 35-hour
 * path it lands in. A null is reported to the administrator; a wrong number is
 * not.
 */
export function parseHours(value: string | undefined): number | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const hm = raw.match(/^(\d+)\s*h(?:ours?)?\s*(\d+)\s*m/i);
  if (hm) return Math.round((Number(hm[1]) + Number(hm[2]) / 60) * 100) / 100;
  const mins = raw.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minutes?)$/i);
  if (mins) return Math.round((Number(mins[1]) / 60) * 100) / 100;
  const hours = raw.match(/(\d+(?:\.\d+)?)/);
  if (!hours) return null;
  const n = Number(hours[1]);
  return Number.isFinite(n) && n > 0 && n <= 500 ? n : null;
}

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export function matchDifficulty(value: string | undefined): string | null {
  const v = norm(value ?? "");
  if (!v) return null;
  if (/beginner|basic|intro|temel|مبتدئ/.test(v)) return "BEGINNER";
  if (/intermediate|orta|متوسط/.test(v)) return "INTERMEDIATE";
  if (/advanced|expert|ileri|متقدم/.test(v)) return "ADVANCED";
  return DIFFICULTIES.find((d) => norm(d) === v) ?? null;
}

export function matchLevel(value: string | undefined): string | null {
  const v = (value ?? "").trim().toUpperCase();
  const direct = LEVEL_CODES.find((c) => c === v);
  if (direct) return direct;
  const m = v.match(/L?([0-4])/);
  return m ? `L${m[1]}` : null;
}

/** Splits candidate values into the ones matching a vocabulary and the rest. */
export function matchEnum<T extends readonly string[]>(values: string[], allowed: T) {
  const ok: string[] = [];
  const bad: string[] = [];
  for (const v of values) {
    const hit = allowed.find((a) => norm(a) === norm(v));
    if (hit) ok.push(hit);
    else bad.push(v);
  }
  return { ok, bad };
}

/**
 * A slug that stays unique at catalogue scale.
 *
 * The previous form truncated `title-code` to 120 characters, which silently
 * dropped the code — the only part guaranteed to be unique — whenever the title
 * was long. Two long titles then collided on Course.slug and the whole import
 * rolled back. Here the title is trimmed to whatever room is left after the
 * code, so the code always survives.
 *
 * `used` covers the rest: slugify lowercases, so two codes differing only in
 * case (YouTube ids are case-sensitive) would otherwise still meet. `own` is the
 * slug this course already holds, which must not count as a collision with
 * itself when a row is re-imported.
 */
export function uniqueSlug(title: string, code: string, used: Set<string>, own?: string) {
  const tail = slugify(code);
  const head = slugify(title).slice(0, Math.max(0, 119 - tail.length));
  const base = (head ? `${head}-${tail}` : tail).slice(0, 120);

  let slug = base;
  for (let n = 2; used.has(slug) && slug !== own; n++) slug = `${base.slice(0, 116)}-${n}`;
  used.add(slug);
  return slug;
}

/** A row keyed by column header, as read from an uploaded table. */
export type ParsedRow = Record<string, string>;

/**
 * RFC-4180 CSV, quotes and embedded newlines included.
 *
 * Lives here rather than next to the spreadsheet reader so that scripts and
 * tests can parse a file without pulling in ExcelJS or `server-only`.
 */
export function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      record.push(field);
      field = "";
    } else if (ch === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || record.length > 0) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }

  const [headerRow = [], ...dataRows] = records;
  const headers = headerRow.map((h) => h.trim()).filter(Boolean);
  const rows = dataRows
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));

  return { headers, rows };
}

/**
 * Reads a "KEY:weight" list, as the competency and department columns use.
 *
 * The importer previously matched the whole `FUNDAMENTALS:4` string against the
 * list of valid keys, found nothing, and dropped it without a word — so every
 * imported course arrived with no competencies at all and the recommendation
 * engine scored them all at its neutral default. A bare `FUNDAMENTALS` is still
 * accepted and takes the default weight.
 */
export function parseWeighted(value: string | undefined, fallbackWeight = 3) {
  const out: { key: string; weight: number }[] = [];
  for (const entry of list(value)) {
    const [rawKey, rawWeight] = entry.split(":");
    const key = rawKey?.trim();
    if (!key) continue;
    const weight = Number(rawWeight);
    out.push({ key, weight: Number.isFinite(weight) && weight > 0 ? weight : fallbackWeight });
  }
  return out;
}
