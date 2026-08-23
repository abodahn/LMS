import { describe, expect, it } from "vitest";
import { extractYouTubeId, isYouTubeUrl, youTubeEmbedUrl } from "../src/lib/youtube";

/**
 * Three things depend on this now: the lesson player decides what to embed, the
 * importer decides whether a course can play in-app at all, and the link
 * checker decides which liveness endpoint to call. A URL form it fails to
 * recognise silently turns a playable course back into an off-site link.
 */
describe("extractYouTubeId", () => {
  it("reads the usual watch forms", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=aircAruvnKk")).toEqual({ video: "aircAruvnKk" });
    expect(extractYouTubeId("https://youtu.be/aircAruvnKk")).toEqual({ video: "aircAruvnKk" });
    expect(extractYouTubeId("https://m.youtube.com/watch?v=aircAruvnKk")).toEqual({ video: "aircAruvnKk" });
    expect(extractYouTubeId("https://www.youtube.com/embed/aircAruvnKk")).toEqual({ video: "aircAruvnKk" });
  });

  it("prefers the playlist when a URL carries both", () => {
    // A video watched inside a playlist: the playlist is the course.
    expect(extractYouTubeId("https://www.youtube.com/watch?v=abc123&list=PL9tY0BWXOZ")).toEqual({
      list: "PL9tY0BWXOZ",
    });
  });

  it("refuses other hosts, so a look-alike URL cannot be embedded", () => {
    expect(extractYouTubeId("https://vimeo.com/watch?v=123")).toBeNull();
    expect(extractYouTubeId("https://youtube.com.evil.test/watch?v=123")).toBeNull();
    expect(extractYouTubeId("not a url")).toBeNull();
    expect(isYouTubeUrl(null)).toBe(false);
  });

  it("builds the no-cookie embed for both shapes", () => {
    expect(youTubeEmbedUrl({ video: "abc" })).toBe("https://www.youtube-nocookie.com/embed/abc");
    expect(youTubeEmbedUrl({ list: "PL1" })).toBe(
      "https://www.youtube-nocookie.com/embed/videoseries?list=PL1",
    );
  });
});
