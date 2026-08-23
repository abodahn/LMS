import { expect, test } from "@playwright/test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { signIn, ACCOUNTS } from "./helpers";

/**
 * SCORM, driven the way a real package drives it.
 *
 * The fixture below is a genuine SCORM 1.2 package whose JavaScript performs the
 * search every authored package performs — walking `window.parent` until it
 * finds an object called `API` — and then reports a pass. Anything less than
 * this would test the upload form rather than the runtime, and the runtime is
 * the part with a specification to get wrong.
 */

const MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="TCAI-E2E" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG">
    <organization identifier="ORG">
      <title>E2E Safety Package</title>
      <item identifier="ITEM1" identifierref="RES1">
        <title>Safety basics</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES1" type="webcontent" adlcp:scormtype="sco" href="content/index.html">
      <file href="content/index.html"/>
    </resource>
  </resources>
</manifest>`;

/** The API hunt, exactly as an authoring tool emits it. */
const SCO = `<!doctype html>
<html><head><meta charset="utf-8"><title>SCO</title></head>
<body>
<p id="out">starting</p>
<script>
  function findAPI(win) {
    for (var i = 0; win && i < 10; i++) {
      if (win.API) return win.API;
      if (win.parent === win) break;
      win = win.parent;
    }
    return null;
  }
  var api = findAPI(window);
  var out = document.getElementById("out");
  if (!api) { out.textContent = "NO API"; }
  else {
    api.LMSInitialize("");
    var name = api.LMSGetValue("cmi.core.student_name");
    api.LMSSetValue("cmi.core.lesson_status", "passed");
    api.LMSSetValue("cmi.core.score.raw", "88");
    api.LMSSetValue("cmi.core.session_time", "00:10:00.00");
    api.LMSSetValue("cmi.suspend_data", "page=4");
    api.LMSCommit("");
    api.LMSFinish("");
    out.textContent = "SCO REPORTED PASSED for " + name;
  }
</script>
</body></html>`;

async function buildPackage(): Promise<string> {
  const zip = new JSZip();
  zip.file("imsmanifest.xml", MANIFEST);
  zip.file("content/index.html", SCO);
  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  const dir = await mkdtemp(path.join(tmpdir(), "tcai-scorm-"));
  const file = path.join(dir, "safety-package.zip");
  await writeFile(file, buffer);
  return file;
}

test.describe("SCORM", () => {
  // Uploading, launching and committing is a long chain across two accounts.
  test.setTimeout(120_000);

  test("an uploaded package runs, finds the API and records a pass", async ({ page }) => {
    const packagePath = await buildPackage();

    // --- an administrator attaches it to a lesson ---------------------------
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/courses?q=INT-AI");

    // The title is a span; the way into a course is the Edit action on its row.
    const row = page.locator("tbody tr").filter({ hasText: /AI at T&C/i }).first();
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: /edit/i }).click();
    await page.waitForURL(/\/admin\/courses\/[^/]+$/, { timeout: 20_000 });

    await expect(page.getByRole("heading", { name: /scorm package/i })).toBeVisible();

    // Remember which lesson the package is attached to, so the learner half can
    // go straight to it instead of paging through the course.
    const lessonSelect = page.locator('select[name="lessonId"]');
    const lessonLabel = (await lessonSelect.locator("option").first().innerText()).trim();
    // The option reads "Module — Lesson", gaining a "(Replace package)" suffix
    // once a package is attached — so this has to survive a re-run.
    const lessonTitle = lessonLabel
      .replace(/\s*\([^)]*\)\s*$/, "")
      .split("—")
      .pop()!
      .trim();

    await page.locator('input[type="file"][name="file"]').setInputFiles(packagePath);
    await page.getByRole("button", { name: /^upload scorm package$/i }).click();

    // The manifest was read: version, entry point and file count come from it.
    await expect(page.getByText(/SCORM 1\.2/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/content\/index\.html/).first()).toBeVisible();

    // --- the same person opens it as a learner ------------------------------
    // The super admin is an ordinary learner too, which keeps this to one
    // session and still exercises the enrolment check in the serving route.
    await page.goto("/catalog?q=AI at T%26C");
    const enroll = page.getByRole("button", { name: /^enroll$/i }).first();
    if (await enroll.isVisible().catch(() => false)) {
      await enroll.click();
      await page.waitForURL(/\/learning$/, { timeout: 20_000 });
    }

    await page.goto("/learning");
    const item = page.locator("main ul > li").filter({ hasText: /AI at T&C/i }).first();
    await expect(item).toBeVisible();
    await item.getByRole("link").first().click();
    await page.waitForURL(/\/learning\/[^/]+$/, { timeout: 20_000 });

    // Straight to the lesson the package was attached to.
    await page.getByRole("link", { name: lessonTitle }).first().click();
    await page.waitForURL(/\/learn\//, { timeout: 20_000 });

    const frame = page.locator("iframe[src*='/api/scorm/']");
    await expect(frame).toHaveCount(1);

    // The package found the API and got the learner's real name back.
    const sco = page.frameLocator("iframe[src*='/api/scorm/']");
    await expect(sco.locator("#out")).toContainText(/SCO REPORTED PASSED for/, { timeout: 30_000 });
    await expect(sco.locator("#out")).not.toContainText("NO API");

    // …and the commit reached the server. Scoped to the player's own live region:
    // a bare text match picks up "Completed" from the collapsed navigation on a
    // phone viewport, which is present but hidden.
    const status = page.getByRole("status").filter({ hasText: /recorded|saved|completed/i }).first();
    await expect(status).toContainText(/completed|progress saved/i, { timeout: 30_000 });
  });
});
