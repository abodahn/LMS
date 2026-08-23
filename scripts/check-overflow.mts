/**
 * Developer utility: walk the app at phone width and report any page that
 * scrolls sideways, naming the element responsible.
 *   npx tsx scripts/check-overflow.mts            (expects the app on :3100)
 */
import { chromium, devices } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const PASSWORD = process.env.DEMO_PASSWORD ?? "Academy2026!";

const PAGES = [
  "/",
  "/learning",
  "/assessments",
  "/certificates",
  "/passport",
  "/toolbox",
  "/prompts",
  "/use-cases",
  "/catalog",
  "/profile",
  "/notifications",
  "/capstone",
  "/team",
  "/team/reviews",
  "/admin",
  "/admin/people",
  "/admin/people/import",
  "/admin/people/new",
  "/admin/org",
  "/admin/courses",
  "/admin/courses/new",
  "/admin/paths",
  "/admin/paths/new",
  "/admin/assessments",
  "/admin/assessments/new",
  "/admin/questions",
  "/admin/questions/new",
  "/admin/recommendation",
  "/admin/enrollments",
  "/admin/certificates",
  "/admin/analytics",
  "/admin/reports",
  "/admin/content",
  "/admin/opportunities",
  "/admin/settings",
  "/admin/audit",
];

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["Pixel 7"] });
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.getByLabel(/employee id or email/i).fill("TC-0001");
await page.getByLabel(/^password/i).fill(PASSWORD);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForURL((url) => !url.pathname.startsWith("/login"));

let failures = 0;
for (const path of PAGES) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  const result = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;

    window.scrollTo(4000, 0);
    const scrolled = Math.round(window.scrollX);
    window.scrollTo(0, 0);

    const offenders = [...document.querySelectorAll("body *")]
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ el, rect }) => rect.right > vw + 1 && rect.width > 0 && !el.closest('[class*="overflow-x-auto"]'))
      .slice(0, 6)
      .map(
        ({ el, rect }) =>
          `${el.tagName}.${String(el.className).split(" ").slice(0, 3).join(".")} w=${Math.round(rect.width)} right=${Math.round(rect.right)}`,
      );

    return { scrolled, overflow: document.body.scrollWidth - vw, vw, offenders };
  });

  if (result.scrolled > 0 || result.overflow > 1) {
    failures++;
    console.log(`\nOVERFLOW ${result.overflow}px (viewport ${result.vw})  ${path}`);
    for (const o of result.offenders) console.log(`    ${o}`);
  } else {
    console.log(`ok  ${path}`);
  }
}

console.log(`\n${failures} page(s) with horizontal overflow.`);
await browser.close();
process.exitCode = failures === 0 ? 0 : 1;
