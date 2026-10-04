import { beforeAll, describe, expect, it } from "vitest";
import { bridgeHtml, isScormHost, signLaunch, verifyLaunch } from "@/lib/scorm/origin";

beforeAll(() => {
  process.env.SCORM_CONTENT_ORIGIN = "https://scorm.example.com";
  process.env.SCORM_TOKEN_SECRET = "test-secret";
});

describe("SCORM launch tokens", () => {
  it("admits the learner it was signed for, to that package, until it expires", () => {
    const now = Date.now();
    const seg = signLaunch("pkg1", "user1", now);
    expect(verifyLaunch(seg, "pkg1", now)).toBe("user1");
    expect(verifyLaunch(seg, "pkg2", now)).toBeNull();
    expect(verifyLaunch(seg, "pkg1", now + 9 * 3600_000)).toBeNull();
    const [exp, user, sig] = seg.slice(1).split(".");
    expect(verifyLaunch(`~${exp}.${Buffer.from("user2").toString("base64url")}.${sig}`, "pkg1", now)).toBeNull();
    expect(verifyLaunch(`~${Number(exp) + 3600}.${user}.${sig}`, "pkg1", now)).toBeNull();
    expect(verifyLaunch("index.html", "pkg1", now)).toBeNull();
  });
  it("recognises the content host and keeps inlined values inside the script", () => {
    expect(isScormHost(new Headers({ host: "scorm.example.com" }))).toBe(true);
    expect(isScormHost(new Headers({ host: "academy.example.com" }))).toBe(false);
    expect(bridgeHtml("https://academy.example.com", "a</script><script>alert(1)//.html")).not.toContain("</script><script>alert");
  });
});
