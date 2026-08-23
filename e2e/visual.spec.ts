import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

/**
 * Design-system guards.
 *
 * These do not test that the UI is attractive — nothing can. They test the two
 * things that quietly rot as a design evolves: text that stops being readable,
 * and a depth model applied inconsistently. Both are invisible in review and
 * obvious to the person who has to use the screen every day.
 */

/**
 * WCAG contrast for every visible text node.
 *
 * Colours are composited through a 1×1 canvas rather than parsed out of the
 * computed string. Modern browsers hand back `oklab(… / 0.75)` and
 * `color(srgb …)` as readily as `rgb()`, and a hand-rolled parser silently
 * misreads both — reading an oklab lightness as a red channel produced a
 * confident 4.44:1 for text that is actually at 10:1. Letting the browser
 * resolve the colour space and flatten the alpha removes that whole class of
 * error, and it is less code.
 */
const CONTRAST_AUDIT = `(() => {
  const probe = document.createElement('canvas');
  probe.width = probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });

  /** Flattens \`color\` over \`background\` and returns the painted [r,g,b]. */
  const composite = (color, background) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lum = (rgb) => {
    const c = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (fg, bg) => {
    const [x, y] = [lum(fg), lum(bg)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const fails = [], seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!el.textContent || !el.textContent.trim() || el.children.length) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent) continue;
    // Screen-reader-only text is clipped to a 1px box and never painted, so a
    // contrast ratio for it is meaningless.
    const box = el.getBoundingClientRect();
    if (box.width <= 1 || box.height <= 1 || cs.clipPath === 'inset(50%)') continue;
    // Walk up for the nearest painted background, flattening translucency as
    // we go — a half-opaque panel over the canvas is what the eye actually sees.
    let bg = 'rgb(255,255,255)', n = el;
    const layers = [];
    while (n) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && !c.startsWith('rgba(0, 0, 0, 0')) layers.unshift(c);
      n = n.parentElement;
    }
    for (const layer of layers) bg = 'rgb(' + composite(layer, bg).join(',') + ')';

    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    const r = ratio(composite(cs.color, bg), composite(bg, bg));
    if (r < need) {
      const key = cs.color + '|' + bg + '|' + Math.round(size);
      if (seen.has(key)) continue;
      seen.add(key);
      fails.push(el.textContent.trim().slice(0, 40) + ' — ' + r.toFixed(2) + ':1 at ' + size + 'px (needs ' + need + ')');
    }
  }
  return fails;
})()`;

const EMPLOYEE_PAGES = ["/", "/learning", "/assessments", "/catalog", "/certificates", "/passport", "/profile"];
const ADMIN_PAGES = ["/admin", "/admin/people", "/admin/courses", "/admin/analytics", "/admin/reports"];

test.describe("readability", () => {
  test("every employee page meets AA contrast", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    for (const path of EMPLOYEE_PAGES) {
      await page.goto(path);
      const failures = (await page.evaluate(CONTRAST_AUDIT)) as string[];
      expect(failures, `${path}\n${failures.join("\n")}`).toEqual([]);
    }
  });

  test("every administration page meets AA contrast", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    for (const path of ADMIN_PAGES) {
      await page.goto(path);
      const failures = (await page.evaluate(CONTRAST_AUDIT)) as string[];
      expect(failures, `${path}\n${failures.join("\n")}`).toEqual([]);
    }
  });
});

test.describe("depth model", () => {
  test("cards are flat — a surface is bordered or raised, never both", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/");

    const doubled = await page.evaluate(() =>
      [...document.querySelectorAll(".card")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.boxShadow !== "none" && cs.borderStyle !== "none";
        })
        .map((el) => (el.className || "").toString().slice(0, 60)),
    );
    expect(doubled, "cards carrying both a border and a shadow").toEqual([]);
  });

  test("the mobile drawer does float, because it sits above the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/");
    await page.getByRole("button", { name: /main menu|القائمة|menü/i }).first().click();

    const shadow = await page
      .locator("div.absolute.inset-y-0")
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe("none");
  });
});
