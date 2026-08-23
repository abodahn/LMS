import { describe, expect, it } from "vitest";
import { parseManifest, ManifestError } from "../src/lib/scorm/manifest";
import { safeEntryPath, ScormUploadError } from "../src/lib/scorm/paths";
import { toCmiTime, fromCmiTime, normaliseStatus, isWritable, scoreOf } from "../src/lib/scorm/cmi";

const manifest12 = `<?xml version="1.0"?>
<manifest identifier="M1" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG">
    <organization identifier="ORG">
      <title>Fire Safety</title>
      <item identifier="I1" identifierref="R1"><title>Module one</title>
        <adlcp:masteryscore>80</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="R1" type="webcontent" adlcp:scormtype="sco" href="content/index.html"/>
    <resource identifier="R2" type="webcontent" adlcp:scormtype="asset" href="content/logo.png"/>
  </resources>
</manifest>`;

const manifest2004 = `<?xml version="1.0"?>
<manifest identifier="M2" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations default="O"><organization identifier="O"><title>Quality</title>
    <item identifier="A" identifierref="RA"><title>Part A</title></item>
    <item identifier="B" identifierref="RB"><title>Part B</title></item>
  </organization></organizations>
  <resources>
    <resource identifier="RA" adlcp:scormType="sco" href="a/start.html"/>
    <resource identifier="RB" adlcp:scormType="sco" href="b/start.html"/>
  </resources>
</manifest>`;

describe("parseManifest", () => {
  it("reads a SCORM 1.2 package", () => {
    const m = parseManifest(manifest12);
    expect(m.version).toBe("1.2");
    expect(m.title).toBe("Fire Safety");
    expect(m.entryHref).toBe("content/index.html");
    expect(m.masteryScore).toBe(80);
    // Assets are not launchable and must not appear as SCOs.
    expect(m.scos).toHaveLength(1);
  });

  it("reads a SCORM 2004 package and keeps item order", () => {
    const m = parseManifest(manifest2004);
    expect(m.version).toBe("2004");
    expect(m.entryHref).toBe("a/start.html");
    expect(m.scos.map((s) => s.title)).toEqual(["Part A", "Part B"]);
  });

  it("decodes an escaped href, because disk paths are not URI-encoded", () => {
    const m = parseManifest(manifest12.replace("content/index.html", "my%20course/index.html"));
    expect(m.entryHref).toBe("my course/index.html");
  });

  it("refuses a file that is not a manifest", () => {
    expect(() => parseManifest("<html><body>nope</body></html>")).toThrow(ManifestError);
    expect(() => parseManifest(manifest12.replace(/<resources>[\s\S]*<\/resources>/, "<resources/>"))).toThrow(
      ManifestError,
    );
  });
});

describe("safeEntryPath", () => {
  const root = process.platform === "win32" ? String.raw`C:\storage\scorm\pkg` : "/storage/scorm/pkg";

  it("accepts paths inside the package", () => {
    expect(safeEntryPath(root, "content/index.html")).toContain("index.html");
    expect(safeEntryPath(root, "deep/nested/file.js")).toContain("file.js");
  });

  it("refuses anything escaping the package root", () => {
    // Writing this unchecked would let an upload overwrite any file the process
    // can reach — the whole reason this function exists.
    expect(() => safeEntryPath(root, "../../etc/passwd")).toThrow(ScormUploadError);
    expect(() => safeEntryPath(root, "..\\..\\windows\\system32\\x.dll")).toThrow(ScormUploadError);
    expect(() => safeEntryPath(root, "/etc/passwd")).toThrow(ScormUploadError);
    expect(() => safeEntryPath(root, "C:/windows/x.dll")).toThrow(ScormUploadError);
    expect(() => safeEntryPath(root, "ok/../../../outside.txt")).toThrow(ScormUploadError);
  });
});

describe("cmi", () => {
  it("round-trips both time formats", () => {
    expect(toCmiTime(3661, "1.2")).toBe("0001:01:01.00");
    expect(fromCmiTime("0001:01:01.00")).toBe(3661);
    expect(toCmiTime(3661, "2004")).toBe("PT1H1M1S");
    expect(fromCmiTime("PT1H1M1S")).toBe(3661);
    expect(fromCmiTime("")).toBe(0);
    expect(fromCmiTime("garbage")).toBe(0);
  });

  it("maps 2004's split status onto one vocabulary, with failure winning", () => {
    expect(normaliseStatus("2004", { "cmi.completion_status": "completed", "cmi.success_status": "failed" })).toBe(
      "failed",
    );
    expect(normaliseStatus("2004", { "cmi.completion_status": "completed", "cmi.success_status": "passed" })).toBe(
      "passed",
    );
    expect(normaliseStatus("2004", { "cmi.completion_status": "completed" })).toBe("completed");
    expect(normaliseStatus("1.2", { "cmi.core.lesson_status": "incomplete" })).toBe("incomplete");
    expect(normaliseStatus("1.2", {})).toBe("not attempted");
  });

  it("refuses writes to read-only elements", () => {
    expect(isWritable("1.2", "cmi.core.lesson_status")).toBe(true);
    expect(isWritable("1.2", "cmi.core.student_name")).toBe(false);
    expect(isWritable("2004", "cmi.learner_name")).toBe(false);
    expect(isWritable("1.2", "cmi.interactions.0.id")).toBe(true);
  });

  it("reads scores from whichever prefix the version uses", () => {
    expect(scoreOf("1.2", { "cmi.core.score.raw": "88" }).raw).toBe(88);
    expect(scoreOf("2004", { "cmi.score.raw": "72" }).raw).toBe(72);
    expect(scoreOf("1.2", { "cmi.core.score.raw": "" }).raw).toBeNull();
  });
});
