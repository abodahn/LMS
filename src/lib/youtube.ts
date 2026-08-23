/**
 * YouTube URL handling, shared by the lesson player, the catalogue importer and
 * the link checker.
 *
 * Pure string work with no I/O so that scripts and tests can use it without
 * pulling in Prisma or `server-only`.
 */

export type YouTubeRef = { video?: string; list?: string };

const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"]);

/**
 * Extracts the video or playlist id from a watch URL.
 *
 * A playlist wins over a single video: when a URL carries both, it is a video
 * being watched *within* a playlist, and the playlist is the course.
 */
export function extractYouTubeId(url: string): YouTubeRef | null {
  try {
    const u = new URL(url);
    if (!HOSTS.has(u.hostname)) return null;

    const list = u.searchParams.get("list");
    if (list) return { list };

    const v = u.searchParams.get("v");
    if (v) return { video: v };

    // youtu.be/<id> and youtube.com/embed/<id>
    const path = u.pathname.replace(/^\/(embed|v|shorts)\//, "/").slice(1);
    if (path && !path.includes("/")) return { video: path };

    return null;
  } catch {
    return null;
  }
}

export const isYouTubeUrl = (url: string | null | undefined): boolean =>
  !!url && extractYouTubeId(url) !== null;

/** The privacy-preserving embed URL, which is the only one this app renders. */
export function youTubeEmbedUrl(ref: YouTubeRef): string {
  return ref.list
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${ref.list}`
    : `https://www.youtube-nocookie.com/embed/${ref.video}`;
}

/**
 * The oEmbed endpoint, which answers 404 for anything deleted, private or
 * blocked from embedding — a stronger liveness check than the watch page,
 * which returns 200 with an "unavailable" message.
 */
export function youTubeOEmbedUrl(url: string): string {
  return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
}
