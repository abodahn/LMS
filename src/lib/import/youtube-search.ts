import { youTubeOEmbedUrl } from "../youtube";

/**
 * Finding real courses on YouTube.
 *
 * Shared by the topic harvester and the language harvester, because the awkward
 * parts are the same either way: YouTube's search page is server-rendered into
 * one large JSON blob whose shape varies by result layout, the site starts
 * refusing connections after roughly ten rapid searches, and a watch page
 * returns 200 for a video that has been deleted — only the oEmbed endpoint
 * tells the truth about that.
 *
 * Nothing here invents anything. Titles, channel names and runtimes are
 * whatever YouTube returned for a query.
 */

export type HarvestLanguage = "en" | "ar" | "tr";
export type Candidate = { videoId: string; title: string; channel: string; seconds: number };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const REGION: Record<HarvestLanguage, string> = { en: "US", ar: "EG", tr: "TR" };

/** `videoRenderer` nodes are nested differently depending on the result layout, so walk for them. */
export function collectRenderers(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    for (const item of node) collectRenderers(item, out);
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.videoRenderer) out.push(obj.videoRenderer as Record<string, unknown>);
    for (const value of Object.values(obj)) collectRenderers(value, out);
  }
  return out;
}

const text = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";
  const o = node as { simpleText?: string; runs?: { text: string }[] };
  return o.simpleText ?? (o.runs ?? []).map((r) => r.text).join("") ?? "";
};

/** "1:23:45" / "45:10" → seconds. */
function toSeconds(label: string): number {
  const parts = label.split(":").map((n) => Number(n.trim()));
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * YouTube starts refusing connections after roughly ten searches in quick
 * succession, so every search is paced and retried with a widening gap. This is
 * the slow part of the run by design — a harvest takes a few minutes.
 */
export async function searchWithRetry(query: string, lang: HarvestLanguage, tries = 4): Promise<Candidate[]> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const found = await search(query, lang);
      if (found.length) return found;
    } catch {
      // fall through to the backoff below
    }
    if (attempt < tries) await sleep(2000 * attempt + Math.floor(Math.random() * 800));
  }
  return [];
}

async function search(query: string, lang: HarvestLanguage): Promise<Candidate[]> {
  // sp=EgIYAg%3D%3D restricts to videos over 20 minutes: the length filter is
  // doing the quality filtering here, since a "course" is not a three-minute clip.
  const url =
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` +
    `&sp=EgIYAg%3D%3D&hl=${lang}&gl=${REGION[lang]}`;

  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": lang } });
  if (!res.ok) return [];
  const html = await res.text();

  const match = html.match(/var ytInitialData = (\{[\s\S]+?\});<\/script>/);
  if (!match) return [];

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const out: Candidate[] = [];
  for (const r of collectRenderers(data)) {
    const videoId = typeof r.videoId === "string" ? r.videoId : "";
    const title = text(r.title).trim();
    const channel = (text(r.ownerText) || text(r.longBylineText)).trim();
    const seconds = toSeconds(text(r.lengthText));
    if (!videoId || !title || !channel || !seconds) continue;
    // Between 20 minutes and 12 hours: shorter is a clip, longer is usually a
    // livestream recording or a lo-fi loop that matched on the title alone.
    if (seconds < 20 * 60 || seconds > 12 * 3600) continue;
    out.push({ videoId, title, channel, seconds });
  }
  return out;
}

/** oEmbed 404s for anything deleted, private or blocked from embedding. */
export async function verify(videoId: string): Promise<{ title: string; channel: string } | null> {
  const url = youTubeOEmbedUrl(`https://www.youtube.com/watch?v=${videoId}`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: string; author_name?: string };
    if (!body.title || !body.author_name) return null;
    return { title: body.title, channel: body.author_name };
  } catch {
    return null;
  }
}

export async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return results;
}
