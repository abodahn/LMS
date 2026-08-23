import { expect, test } from "@playwright/test";

/**
 * Registration is activation: it claims an account HR already put on the
 * roster. The two things worth proving are that a real employee can claim
 * theirs, and that somebody who is not on the roster cannot get in at all —
 * because this form is reachable from the public internet.
 */

const stamp = () => Date.now().toString(36);

test.describe("registration", () => {
  test("a stranger cannot create an account", async ({ page }) => {
    await page.goto("/register");

    await page.locator('input[name="employeeCode"]').fill(`TC-NOPE-${stamp()}`);
    await page.locator('input[name="email"]').fill("outsider@example.com");
    await page.locator('input[name="password"]').fill("Str0ngEnough123");
    await page.locator('input[name="confirm"]').fill("Str0ngEnough123");
    await page.getByRole("button", { name: /create your account/i }).click();

    await expect(page.locator('form [role="alert"]')).toContainText(/could not set up an account/i, {
      timeout: 20_000,
    });
    // Still on the form, not inside the application.
    await expect(page).toHaveURL(/\/register/);
  });

  test("the wrong email for a real employee is refused", async ({ page }) => {
    await page.goto("/register");

    // TC-2004 exists in the demo roster; the address does not match.
    await page.locator('input[name="employeeCode"]').fill("TC-2004");
    await page.locator('input[name="email"]').fill("wrong.address@example.com");
    await page.locator('input[name="password"]').fill("Str0ngEnough123");
    await page.locator('input[name="confirm"]').fill("Str0ngEnough123");
    await page.getByRole("button", { name: /create your account/i }).click();

    await expect(page.locator('form [role="alert"]')).toContainText(/could not set up an account/i, {
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/register/);
  });

  test("a weak password is refused before anything is claimed", async ({ page }) => {
    await page.goto("/register");

    await page.locator('input[name="employeeCode"]').fill("TC-2004");
    await page.locator('input[name="email"]').fill("hossam.nabil@tcgarments.com");
    // Ten characters, but no digit.
    await page.locator('input[name="password"]').fill("abcdefghijk");
    await page.locator('input[name="confirm"]').fill("abcdefghijk");
    await page.getByRole("button", { name: /create your account/i }).click();

    await expect(page.locator('form [role="alert"]')).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/register/);
  });

  test("the sign-in page offers registration to a first-time employee", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /create your account/i });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/register/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });
});
