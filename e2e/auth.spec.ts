import { expect, test } from "@playwright/test";
import { ACCOUNTS, apiGet, PASSWORD, signIn, signOut } from "./helpers";

test.describe("authentication", () => {
  test("rejects a wrong password with a human message and no detail leak", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/employee id or email/i).fill(ACCOUNTS.employee.id);
    await page.getByLabel(/^password/i).fill("definitely-not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    const alert = page.getByRole("alert").first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/not correct/i);
    // The message must not reveal whether the account exists.
    await expect(alert).not.toContainText(/user|account not found|unknown/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in with an employee ID and lands on the dashboard", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/omar/i);
  });

  test("signs in with an email address too", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/employee id or email/i).fill("omar.zaki@tcgarments.com");
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL((url) => !url.pathname.startsWith("/login"));
  });

  test("protects every authenticated route from anonymous visitors", async ({ page }) => {
    for (const path of ["/", "/learning", "/certificates", "/team", "/admin", "/admin/settings"]) {
      await page.goto(path);
      await expect(page, `${path} should redirect to login`).toHaveURL(/\/login/);
    }
  });

  test("signs out and ends the session", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await signOut(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("offers a password reset without revealing whether the account exists", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/email/i).fill("nobody@tcgarments.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("status")).toContainText(/on its way/i);
  });
});

test.describe("permissions", () => {
  test("an employee cannot reach the administration area", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/admin");
    await expect(page).toHaveURL(/no-access/);
    await expect(page.getByText(/don't have access/i)).toBeVisible();
  });

  test("an employee cannot reach the team area", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/team");
    await expect(page).toHaveURL(/no-access/);
  });

  test("a manager sees their team but not system settings", async ({ page }) => {
    await signIn(page, ACCOUNTS.manager.id);
    await page.goto("/team");
    await expect(page.getByRole("heading", { name: /my team/i })).toBeVisible();

    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/no-access/);
  });

  test("an L&D admin can manage the catalog but not system settings", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.id);
    await page.goto("/admin/courses");
    await expect(page.getByRole("heading", { name: /course catalog/i })).toBeVisible();

    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/no-access/);
  });

  test("the super admin reaches settings and the audit log", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { name: /audit log/i })).toBeVisible();
  });

  test("an employee cannot export the people report", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    const response = await apiGet(page, "/api/export/employees");
    expect(response.status, "employee must not be able to export the people report").toBe(403);
  });

  test("an employee cannot read another employee's uploaded proof", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    const response = await apiGet(page, "/api/files/proofs/someone-else/whatever.pdf");
    expect([403, 404]).toContain(response.status);
  });
});
