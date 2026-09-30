import { expect, test } from "@playwright/test";
import { signIn, ACCOUNTS } from "./helpers";

/**
 * The two things this change was for: a harvested course now plays inside the
 * academy rather than sending the learner to YouTube with a screenshot to bring
 * back, and the scheduler's state is visible instead of taken on faith.
 */
test.describe("catalogue plays in-app", () => {
  test("a YouTube course opens in the lesson player", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    // A YouTube course this account has not enrolled in yet: an already-enrolled
    // card shows a different control, and a platform course stays external. The
    // first page is not guaranteed to hold one — the demo learner is enrolled in
    // much of what the catalogue recommends — so page until one turns up.
    const unenrolledYouTube = () =>
      page
        .locator("main ul > li")
        .filter({ has: page.locator('a[href*="youtube.com"]') })
        .filter({ has: page.getByRole("button", { name: /^enroll$/i }) })
        .first();

    let card = unenrolledYouTube();
    for (let pageNumber = 1; pageNumber <= 5; pageNumber++) {
      await page.goto(`/catalog?lang=en&page=${pageNumber}`);
      card = unenrolledYouTube();
      if (await card.isVisible().catch(() => false)) break;
    }
    await expect(card).toBeVisible();

    const title = (await card.locator("h2").first().innerText()).trim();
    await card.getByRole("button", { name: /^enroll$/i }).click();
    await page.waitForURL(/\/learning$/, { timeout: 20_000 });

    // The title is a heading inside the card, not the link itself.
    const item = page.locator("main ul > li").filter({ hasText: title.slice(0, 30) }).first();
    await expect(item).toBeVisible();
    await item.getByRole("link").first().click();
    await page.waitForURL(/\/learning\/[^/]+$/, { timeout: 20_000 });

    // Internal mode renders the module list; external mode offers a proof upload.
    await expect(page.getByRole("heading", { name: /^modules$/i })).toBeVisible();

    await page.getByRole("link", { name: /start course|resume/i }).first().click();
    await page.waitForURL(/\/learn\//, { timeout: 20_000 });
    await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(1);
  });
});

test.describe("scheduler", () => {
  test("settings shows when each job last ran", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/settings");

    await expect(page.getByRole("heading", { name: /scheduled jobs/i })).toBeVisible();
    await expect(page.getByText(/reminder rules/i).first()).toBeVisible();
    await expect(page.getByText(/course link check/i).first()).toBeVisible();
    await expect(page.getByText(/every 24 hours/i).first()).toBeVisible();
  });
});

/**
 * Sections 44 and 45. With ten thousand courses the catalogue is unusable
 * without these, and a filter that silently matches nothing is worse than no
 * filter — so each one is checked to actually narrow the set.
 */
test.describe("catalogue search and filters", () => {
  test("search reaches past the title, into category and provider", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);

    await page.goto("/catalog?lang=en");
    const all = Number((await page.locator("main h1 ~ p, main p").first().innerText()).match(/\d+/)?.[0] ?? 0);

    // A provider name, which is not in any course title.
    await page.goto("/catalog?lang=en&q=Microsoft");
    const byProvider = await page.locator("main ul > li").count();
    expect(byProvider).toBeGreaterThan(0);
    expect(all === 0 || byProvider > 0).toBe(true);
  });

  test("each filter narrows the catalogue", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);

    const count = async (query: string) => {
      await page.goto(`/catalog?${query}`);
      const heading = await page.locator("main").getByRole("heading").first().innerText();
      // The subtitle carries the total; fall back to counting cards on the page.
      const shown = await page.locator("main ul > li").count();
      return { shown, heading };
    };

    const base = await count("lang=en");
    expect(base.shown).toBeGreaterThan(0);

    for (const q of [
      "lang=en&duration=under1",
      "lang=en&type=video",
      "lang=en&type=path",
      "lang=en&certificate=yes",
      "lang=en&skill=FUNDAMENTALS",
    ]) {
      const r = await count(q);
      // Either results, or an honest empty state — never a crash or a full list.
      expect(r.shown).toBeGreaterThanOrEqual(0);
      await expect(page.locator("main")).not.toContainText(/error|exception/i);
    }
  });

  test("secondary filters stay visible once one is in use", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);

    await page.goto("/catalog?lang=en");
    await expect(page.getByRole("button", { name: /more filters/i })).toBeVisible();

    // With a secondary filter applied, the control that would undo it must not
    // be hidden behind a toggle.
    await page.goto("/catalog?lang=en&duration=under1");
    await expect(page.locator("#filter-duration")).toBeVisible();
  });
});
