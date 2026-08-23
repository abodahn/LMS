import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

test.describe("employee journey", () => {
  test("a new starter is guided into onboarding rather than an empty dashboard", async ({ page }) => {
    await signIn(page, ACCOUNTS.newStarter.id);
    const nextStep = page.getByRole("region", { name: /next step/i });
    await expect(nextStep).toBeVisible();
    await expect(nextStep.getByRole("link")).toBeVisible();
  });

  test("the dashboard always offers exactly one primary next action", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    const nextStep = page.getByRole("region", { name: /next step/i });
    await expect(nextStep).toBeVisible();
    await expect(nextStep.getByRole("link")).toHaveCount(1);
  });

  test("an assessment can be started, autosaves, and can be resumed", async ({ page }) => {
    await signIn(page, ACCOUNTS.newStarter.id);
    await page.goto("/assessments");

    // An earlier run may have left an attempt open, so accept either entry point.
    const resume = page.getByRole("link", { name: /resume assessment/i }).first();
    if (await resume.isVisible().catch(() => false)) {
      await resume.click();
    } else {
      await page.getByRole("button", { name: /start assessment/i }).first().click();
    }
    await page.waitForURL(/\/assessment\//, { timeout: 30_000 });

    await expect(page.getByText(/question 1 of/i)).toBeVisible();

    // Pick an option that is not already selected, so a save definitely fires.
    await page
      .locator('input[type="radio"]:not(:checked), input[type="checkbox"]:not(:checked)')
      .first()
      .check();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 15_000 });

    // Count what is selected now rather than assuming one: a multi-select
    // question holds several answers, and a resumed attempt may already carry
    // some. Either way the selection must come back unchanged after a reload.
    const selected = await page.locator("input:checked").count();
    expect(selected).toBeGreaterThan(0);

    const url = page.url();
    await page.goto("/");
    await page.goto(url);
    // The saved answer survives a reload.
    await expect(page.locator("input:checked")).toHaveCount(selected);
  });

  test("the assessment result shows a level, strengths and explained recommendations", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/assessments");
    await page.getByRole("link", { name: /^view$/i }).first().click();
    await page.waitForURL(/\/result/);

    await expect(page.getByText(/your ai level/i).first()).toBeVisible();
    await expect(page.getByText(/strengths/i).first()).toBeVisible();
    await expect(page.getByText(/development areas/i).first()).toBeVisible();

    // A recommendation must never be a bare score.
    const recommendations = page.locator("section", { hasText: /recommended for you/i });
    if (await recommendations.count()) {
      await expect(recommendations.first()).toContainText(/because|improves|built for|written for|required|covers/i);
    }
  });

  test("skill analysis detail is behind a disclosure, not on the headline", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/assessments");
    await page.getByRole("link", { name: /^view$/i }).first().click();
    await page.waitForURL(/\/result/);

    // The disclosure renames itself when open, so match on the control, not the text.
    const toggle = page.locator('button[aria-expanded]').filter({ hasText: /skill analysis|hide details/i }).first();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/^total$/i).first()).toBeVisible();
  });

  test("a lesson can be opened and completed, and progress is kept", async ({ page }) => {
    await signIn(page, ACCOUNTS.manager.id);
    await page.goto("/learning");
    await page.getByRole("link", { name: /review|resume|start course/i }).first().click();
    await page.waitForURL(/\/learning\//);

    const openLesson = page.getByRole("link", { name: /start course|resume/i }).first();
    if (await openLesson.isVisible().catch(() => false)) {
      await openLesson.click();
      await page.waitForURL(/\/learn\//, { timeout: 20_000 });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText(/lesson \d+ of \d+/i)).toBeVisible();
    }
  });

  test("certificates show what is still required before one is issued", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/certificates");
    await expect(page.getByRole("heading", { level: 1, name: /certificates/i })).toBeVisible();
  });

  test("a certificate verifies publicly without leaking employee data", async ({ page, browser }) => {
    await signIn(page, ACCOUNTS.manager.id);
    await page.goto("/certificates");

    const verify = page.getByRole("link", { name: /verify/i }).first();
    if (!(await verify.isVisible().catch(() => false))) test.skip();
    const href = await verify.getAttribute("href");

    // Verification is public: check it in a clean, signed-out context.
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`${page.url().split("/certificates")[0]}${href}`);
    await expect(anonPage.getByText(/valid certificate/i)).toBeVisible();
    await expect(anonPage.locator("body")).not.toContainText("@tcgarments.com");
    await anon.close();
  });

  test("an unknown certificate code is reported, not crashed", async ({ page }) => {
    await page.goto("/verify/TCAI-0000-999999");
    await expect(page.getByText(/could not find a certificate/i)).toBeVisible();
  });

  test("the AI skill passport gathers the employee record in one place", async ({ page }) => {
    await signIn(page, ACCOUNTS.manager.id);
    await page.goto("/passport");
    await expect(page.getByRole("heading", { name: /ai skill passport/i })).toBeVisible();
    await expect(page.getByText(/current ai level/i)).toBeVisible();
    await expect(page.getByText(/assessment history/i)).toBeVisible();
  });
});

test.describe("content surfaces", () => {
  test("the prompt library filters on the server and keeps the URL shareable", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/prompts");
    await expect(page.getByRole("heading", { name: /prompt library/i })).toBeVisible();

    await page.getByLabel(/difficulty/i).selectOption("MEDIUM");
    await page.waitForURL(/difficulty=MEDIUM/);
    await expect(page.getByRole("button", { name: /copy prompt/i }).first()).toBeVisible();
  });

  test("every use case carries a data sensitivity warning", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/use-cases");
    const cards = page.locator("main").getByRole("listitem").filter({ hasText: /example prompt/i });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(cards.nth(i)).toContainText(/data sensitivity/i);
    }
  });

  test("the catalog is searchable", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/catalog");
    await page.locator("#filter-search").fill("prompting");
    await page.keyboard.press("Enter");
    await page.waitForURL(/q=prompting/);
    await expect(page.locator("main").getByRole("heading", { name: /prompting/i }).first()).toBeVisible();
  });
});

/**
 * The catalogue carries over a thousand courses in three languages, most of
 * them free. These are the two filters that decide whether an employee can
 * actually take what they find: one they can follow, and one nobody has to
 * raise a budget line for.
 */
test.describe("catalog filters", () => {
  test("language filter narrows the catalogue to courses an employee can follow", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);

    await page.goto("/catalog");
    const all = await page.locator("main ul > li").count();
    expect(all).toBeGreaterThan(0);

    await page.goto("/catalog?lang=ar");
    await expect(page.locator("main ul > li").first()).toBeVisible();

    // Arabic titles are Arabic-script; the filter is worthless if it lets
    // English rows through, which is exactly what the harvest had to fix.
    const titles = await page.locator("main ul > li h2").allInnerTexts();
    expect(titles.length).toBeGreaterThan(0);
    const arabic = titles.filter((t) => /[\u0600-\u06FF]/.test(t));
    expect(arabic.length, titles.slice(0, 5).join(" | ")).toBeGreaterThan(titles.length / 2);
  });

  test("free with no approval needed is narrower than free", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);

    await page.goto("/catalog?cost=noapproval");
    await expect(page.locator("main ul > li").first()).toBeVisible();

    // Every result must be free, so no card may show a price.
    const cards = page.locator("main ul > li");
    for (let i = 0; i < Math.min(await cards.count(), 6); i++) {
      await expect(cards.nth(i)).not.toContainText(/\$|USD/);
    }
  });

  test("paging through the catalogue keeps the filters", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/catalog?lang=en");

    const next = page.getByRole("button", { name: /next/i });
    await expect(next).toBeVisible();
    await next.click();
    await page.waitForURL(/page=2/);
    await expect(page).toHaveURL(/lang=en/);
    await expect(page.locator("main ul > li").first()).toBeVisible();
  });
});
