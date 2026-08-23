import { expect, type Page } from "@playwright/test";

export const ACCOUNTS = {
  superAdmin: { id: "TC-0001", name: "Ahmed Elgohary" },
  admin: { id: "TC-0002", name: "Yasmin Farouk" },
  manager: { id: "TC-1001", name: "Hala Mansour" },
  employee: { id: "TC-1004", name: "Omar Zaki" },
  newStarter: { id: "TC-2004", name: "Hossam Nabil" },
} as const;

export const PASSWORD = process.env.DEMO_PASSWORD ?? "Academy2026!";

/**
 * Signs in and pins the interface to English.
 *
 * Locale is stored on the user record, not the session, so an account left in
 * Arabic by an earlier run — or by someone clicking around the shared dev
 * database — silently breaks every English text matcher in the suite. The
 * failure looks like a product regression and is not one. Setting it explicitly
 * makes each test independent of whatever state it inherits; the tests that
 * care about other languages set them for themselves.
 */
export async function signIn(page: Page, employeeCode: string, locale: "en" | "ar" | "tr" = "en") {
  await page.goto("/login");
  // The sign-in screen has its own switcher, which sets the cookie used before
  // a session exists. Setting it here means the labels below resolve whatever
  // language a previous test left on screen.
  await page.locator("select").filter({ has: page.locator('option[value="ar"]') }).first().selectOption("en");

  await page.getByLabel(/employee id or email|الرقم الوظيفي|çalışan/i).fill(employeeCode);
  await page.getByLabel(/^password|^كلمة المرور|^şifre/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|تسجيل الدخول|giriş yap/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });

  // Past the login screen the account's own preference takes over (see
  // lib/locale.ts), so the cookie above is not enough — switch in-app if the
  // account was left in another language.
  const current = await page.locator("html").getAttribute("lang");
  if (current !== locale) {
    await setLocale(page, locale, (page.viewportSize()?.width ?? 1280) < 768);
    await expect(page.locator("html")).toHaveAttribute("lang", locale, { timeout: 15_000 });
  }
}

export async function signOut(page: Page) {
  // On small screens the control lives inside the navigation drawer.
  const menu = page.getByRole("button", { name: /main menu/i }).first();
  if (await menu.isVisible().catch(() => false)) await menu.click();

  const button = page.getByRole("button", { name: /sign out/i }).first();
  await button.click();
  await page.waitForURL(/\/login/, { timeout: 20_000 });
}

/**
 * The page itself must never scroll sideways. `documentElement.scrollWidth`
 * over-reports when a descendant is its own scroll container, so this checks
 * what the user would actually experience: try to scroll, and see if it moved.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrolled, bodyOverflow, offenders } = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;

    window.scrollTo(4000, window.scrollY);
    const scrolled = Math.round(window.scrollX);
    window.scrollTo(0, window.scrollY);

    const offenders = [...document.querySelectorAll("body *")]
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ el, rect }) => rect.right > vw + 1 && rect.width > 0 && !el.closest('[class*="overflow-x-auto"]'))
      .slice(0, 4)
      .map(
        ({ el, rect }) =>
          `${el.tagName}.${String(el.className).split(" ").slice(0, 3).join(".")} w=${Math.round(rect.width)} right=${Math.round(rect.right)}`,
      );

    return { scrolled, bodyOverflow: document.body.scrollWidth - vw, offenders };
  });

  const detail = [`${page.url()} scrolled ${scrolled}px, body overflow ${bodyOverflow}px`, ...offenders].join(" | ");
  expect(scrolled, detail).toBe(0);
  expect(bodyOverflow, detail).toBeLessThanOrEqual(1);
}

export async function expectNoConsoleErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  page.on("console", onConsole);
  try {
    await run();
  } finally {
    page.off("console", onConsole);
  }
  // Next's dev overlay and favicon noise are not product errors.
  const real = errors.filter((e) => !/favicon|Download the React DevTools|hydrat/i.test(e));
  expect(real, real.join("\n")).toHaveLength(0);
}

/**
 * Calls an API route from inside the page so the browser session cookie is
 * used — Playwright's request context does not share the page's jar.
 */
export async function apiGet(page: Page, url: string) {
  return page.evaluate(async (target) => {
    const res = await fetch(target);
    const buffer = await res.arrayBuffer();
    return {
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      size: buffer.byteLength,
      head: new TextDecoder().decode(buffer.slice(0, 8)),
      text: buffer.byteLength < 400_000 ? new TextDecoder().decode(buffer) : "",
    };
  }, url);
}

/**
 * The language selector lives in the desktop header strip and, on small
 * screens, inside the navigation drawer — so switching needs the drawer open.
 */
export async function setLocale(page: Page, code: "en" | "ar" | "tr", isMobile: boolean) {
  const select = () => page.locator("select:visible").filter({ has: page.locator('option[value="ar"]') }).last();

  // On small screens the switcher lives in the drawer — open it only if the
  // control is not already on screen (it stays open between switches).
  if (isMobile && !(await select().isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /main menu|القائمة الرئيسية|ana menü/i }).first().click();
  }

  await select().selectOption(code);
  await page.waitForLoadState("networkidle").catch(() => {});
}
