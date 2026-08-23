import { expect, test } from "@playwright/test";
import { signIn, ACCOUNTS } from "./helpers";

/**
 * Offline behaviour, with the network genuinely cut.
 *
 * The promise being tested is the one an employee on a factory floor is asked to
 * believe: finish a lesson in a dead zone and it is not lost. Mocking that would
 * prove nothing, so `context.setOffline(true)` pulls the connection out from
 * under a real page and the work is followed through to the server afterwards.
 */

test.describe("installable app", () => {
  test("serves a manifest a phone can install from", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);

    const response = await page.request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBeTruthy();

    // Both purposes matter: Android crops a maskable icon to its own shape, and
    // an icon that is only `any` gets letterboxed on the home screen.
    const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");

    // The icons must actually exist — a manifest pointing at a 404 installs an
    // app with a blank square for a face.
    for (const icon of manifest.icons as { src: string }[]) {
      const file = await page.request.get(icon.src);
      expect(file.status(), icon.src).toBe(200);
    }
  });
});

test.describe("offline", () => {
  test.setTimeout(120_000);

  test("a lesson completed with no signal is held, then sent when it returns", async ({ page, context }) => {
    await signIn(page, ACCOUNTS.employee.id);

    // Reach a lesson in an internal course — one with real lessons to complete.
    await page.goto("/catalog?q=AI at T%26C");
    const enroll = page.getByRole("button", { name: /^enroll$/i }).first();
    if (await enroll.isVisible().catch(() => false)) {
      await enroll.click();
      await page.waitForURL(/\/learning$/, { timeout: 20_000 });
    }

    await page.goto("/learning");
    const course = page.locator("main ul > li").filter({ hasText: /AI at T&C/i }).first();
    await expect(course).toBeVisible();
    await course.getByRole("link").first().click();
    await page.waitForURL(/\/learning\/[^/]+$/, { timeout: 20_000 });

    await page.getByRole("link", { name: /start course|resume/i }).first().click();
    await page.waitForURL(/\/learn\//, { timeout: 20_000 });
    const lessonUrl = page.url();

    // --- the signal drops ---------------------------------------------------
    await context.setOffline(true);

    // The interface says so, rather than pretending.
    await expect(page.getByText(/offline/i).first()).toBeVisible({ timeout: 15_000 });

    const complete = page.getByRole("button", { name: /mark complete|complete/i }).first();
    await expect(complete).toBeVisible();
    await complete.click();

    // Held on the device — and said so, rather than showing a tick that lies.
    // Two things say it: the lesson footer and the standing offline banner.
    await expect(page.getByText(/saved on this device/i).first()).toBeVisible({ timeout: 20_000 });
    // Still on the lesson: the next page could not have been fetched anyway.
    expect(page.url()).toBe(lessonUrl);

    // --- and the signal comes back -----------------------------------------
    await context.setOffline(false);
    await page.reload();

    // The queue drains on load, so the banner goes and the lesson is complete
    // on the server — which is the whole promise.
    await expect(page.getByText(/saved on this device/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^mark complete$/i })).toHaveCount(0, {
      timeout: 20_000,
    });
  });

  test("a navigation with no network gets the offline screen, not a browser error", async ({
    page,
    context,
  }) => {
    await signIn(page, ACCOUNTS.employee.id);
    // The worker only registers in a production build, which is what these
    // tests run against.
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
      timeout: 20_000,
    });

    await context.setOffline(true);
    await page.goto("/passport").catch(() => {});

    await expect(page.getByRole("heading", { name: /offline|غير متصل|çevrim dışı/i })).toBeVisible({
      timeout: 20_000,
    });
    // And it reassures rather than just failing.
    await expect(page.getByText(/saved on this device|not lost/i).first()).toBeVisible();

    await context.setOffline(false);
  });
});
