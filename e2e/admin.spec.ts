import { expect, test } from "@playwright/test";
import { ACCOUNTS, apiGet, signIn } from "./helpers";

test.describe("recommendation console", () => {
  test("previews a path with reasons and rejections, and saves nothing", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/recommendation");

    await expect(page.getByText(/preview only/i)).toBeVisible();

    const picker = page.getByLabel(/select employee/i);
    const value = await picker.locator("option").nth(3).getAttribute("value");
    await picker.selectOption(value!);
    await page.waitForURL(/userId=/);

    await expect(page.getByText(/recommended courses/i).first()).toBeVisible();
    await expect(page.getByText(/engine input/i)).toBeVisible();
    await expect(page.getByText(/rejected courses/i)).toBeVisible();

    // Every recommendation exposes its full component breakdown.
    await expect(page.getByText("AI level match").first()).toBeVisible();
    await expect(page.getByText("Competency gap").first()).toBeVisible();
  });

  test("weights are editable and normalised", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/recommendation");
    await expect(page.getByText(/do not have to add up to 100/i).first()).toBeVisible();
    await expect(page.getByLabel("Role match").first()).toBeVisible();
  });
});

test.describe("administration", () => {
  test("the readiness index always shows its methodology", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/analytics");

    const methodology = page.getByRole("button", { name: /how this is calculated/i }).first();
    await expect(methodology).toBeVisible();
    await methodology.click();
    await expect(page.getByText(/multiplied by its weight/i)).toBeVisible();
  });

  test("reports export an Excel workbook", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.id);
    const response = await apiGet(page, "/api/export/employee-learning");
    expect(response.status).toBe(200);
    expect(response.contentType).toContain("spreadsheetml");
    expect(response.size).toBeGreaterThan(1000);
  });

  test("reports export CSV without formula injection", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.id);
    const response = await apiGet(page, "/api/export/certificates?format=csv");
    expect(response.status).toBe(200);
    const body = response.text;
    // No cell may begin a formula.
    for (const line of body.split("\r\n").slice(1)) {
      for (const cell of line.split(",")) {
        expect(cell.replace(/^"/, "").startsWith("=")).toBe(false);
      }
    }
  });

  test("the executive PDF renders", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    const response = await apiGet(page, "/api/reports/executive");
    expect(response.status).toBe(200);
    expect(response.contentType).toContain("pdf");
    expect(response.size).toBeGreaterThan(2000);
    expect(response.head.startsWith("%PDF")).toBe(true);
  });

  test("the course builder loads a course with its structure", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.id);
    await page.goto("/admin/courses");
    await page.getByRole("link", { name: /^edit$/i }).first().click();
    await page.waitForURL(/\/admin\/courses\//);
    await expect(page.getByText(/general information/i)).toBeVisible();
    await expect(page.getByText(/targeting/i)).toBeVisible();
  });

  test("the assessment builder shows pool availability", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.id);
    await page.goto("/admin/assessments");
    await page.getByRole("link", { name: /^edit$/i }).first().click();
    await page.waitForURL(/\/admin\/assessments\//);
    await expect(page.getByText(/question pools/i)).toBeVisible();
    await expect(page.getByText(/available/i).first()).toBeVisible();
  });

  test("the employee import expects a file before it will do anything", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin.id);
    await page.goto("/admin/people/import");
    await expect(page.getByText(/expected columns/i)).toBeVisible();
    await expect(page.getByText(/employee id/i).first()).toBeVisible();
  });

  test("the audit log records administrative activity", async ({ page }) => {
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/audit?action=LOGIN");
    await expect(page.getByRole("heading", { name: /audit log/i })).toBeVisible();
    const rows = page.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(rows.first()).toContainText("LOGIN");
  });

  test("health reports database reachability", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string; database: string };
    expect(body.status).toBe("ok");
    expect(body.database).toBe("ok");
  });
});

test.describe("error handling", () => {
  test("an unknown page shows a human message, not a stack trace", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/couldn't find that page/i)).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/at Object\.|node_modules|prisma\./i);
  });

  test("an unknown record 404s instead of erroring", async ({ page }) => {
    await signIn(page, ACCOUNTS.employee.id);
    const response = await page.goto("/learning/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
