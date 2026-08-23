import { expect, test } from "@playwright/test";
import { ACCOUNTS, expectNoHorizontalOverflow, setLocale, signIn } from "./helpers";

const EMPLOYEE_PAGES = [
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
];

const ADMIN_PAGES = [
  "/team",
  "/team/reviews",
  "/admin",
  "/admin/people",
  "/admin/people/import",
  "/admin/org",
  "/admin/courses",
  "/admin/paths",
  "/admin/assessments",
  "/admin/questions",
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

test.describe("responsive layout", () => {
  test("employee pages never scroll sideways", async ({ page }) => {
    await signIn(page, ACCOUNTS.manager.id);
    for (const path of EMPLOYEE_PAGES) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("administration pages never scroll sideways", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    for (const path of ADMIN_PAGES) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("the sign-in screen fits a phone", async ({ page }) => {
    await page.goto("/login");
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeInViewport();
  });
});

test.describe("navigation", () => {
  test("mobile navigation opens and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile drawer only exists below the lg breakpoint");
    await signIn(page, ACCOUNTS.employee.id);

    const menu = page.getByRole("button", { name: /main menu/i });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole("navigation", { name: /main menu/i })).toBeVisible();
    await page.getByRole("button", { name: /close/i }).click();
  });

  test("employee navigation stays to five primary items", async ({ page, isMobile }) => {
    test.skip(isMobile, "the sidebar is collapsed on mobile");
    await signIn(page, ACCOUNTS.employee.id);
    const nav = page.getByRole("navigation", { name: /main menu/i }).first();
    await expect(nav.getByRole("link")).toHaveCount(5);
  });

  test("a keyboard user can skip to the content", async ({ page, isMobile }) => {
    test.skip(isMobile, "skip links are a keyboard affordance");
    await signIn(page, ACCOUNTS.employee.id);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /skip to main content/i })).toBeFocused();
  });
});

test.describe("internationalisation", () => {
  test("Arabic switches the whole document to RTL", async ({ page, isMobile }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await setLocale(page, "ar", isMobile ?? false);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expectNoHorizontalOverflow(page);

    // Put it back so the shared demo data is not left in Arabic.
    await setLocale(page, "en", isMobile ?? false);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("Turkish translates the navigation", async ({ page, isMobile }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await setLocale(page, "tr", isMobile ?? false);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.getByRole("link", { name: "Eğitimlerim" }).first()).toBeVisible();
    await setLocale(page, "en", isMobile ?? false);
  });
});
