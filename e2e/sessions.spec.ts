import { expect, test } from "@playwright/test";
import { signIn, signOut, ACCOUNTS } from "./helpers";

/**
 * Instructor-led training, through the chain that actually matters.
 *
 * Capacity, the queue and attendance are the parts with no second chance: a
 * double-booked seat is discovered by a person standing in the wrong room, and a
 * missed promotion is discovered by an empty chair. None of it is reachable from
 * a unit test, because all of it is database state — so it is proved here, by
 * two people competing for one seat.
 */

/** A unique title per run, so repeat runs never collide. */
const stamp = () => `E2E seat test ${Date.now().toString(36)}`;

const localInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
};

/**
 * A future two-hour slot on a day of this run's own.
 *
 * These tests leave seats behind — a run that fails part way certainly does —
 * and a seat is exactly what clash detection refuses to book over. Spreading
 * runs across minutes of one day is not enough: two-hour sessions scattered
 * through a single day collide almost at once. A distinct day each keeps every
 * run's calendar to itself.
 */
function uniqueSlot() {
  const start = new Date(Date.now() + (30 + (Date.now() % 300)) * 86_400_000);
  start.setHours(9, 0, 0, 0);
  return { start, end: new Date(start.getTime() + 2 * 3_600_000) };
}

test.describe("instructor-led training", () => {
  test.setTimeout(150_000);

  test("one seat, two people: the queue forms, moves, and attendance credits the course", async ({ page }) => {
    const title = stamp();
    // A distinct slot per run. A seat left behind by an earlier run sits at the
    // same future date, and clash detection would refuse this one — correctly,
    // which is exactly how this test caught itself the first time.
    const { start, end } = uniqueSlot();

    // --- an administrator schedules a session with exactly one seat ----------
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/sessions/new");

    await page.locator('input[name="title"]').fill(title);
    await page.locator('input[name="startsAt"]').fill(localInput(start));
    await page.locator('input[name="endsAt"]').fill(localInput(end));
    await page.locator('input[name="capacity"]').fill("1");

    // Linked to a course, so attendance has something to complete.
    const courseSelect = page.locator('select[name="courseId"]');
    const courseOption = courseSelect.locator("option").nth(1);
    const courseLabel = (await courseOption.innerText()).trim();
    await courseSelect.selectOption(await courseOption.getAttribute("value") ?? "");

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 20_000 });
    await signOut(page);

    // --- the first learner takes the only seat ------------------------------
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/sessions");
    const forEmployee = page.locator("main ul > li").filter({ hasText: title }).first();
    await expect(forEmployee).toBeVisible();
    await forEmployee.getByRole("button", { name: /^register$/i }).click();
    // The card moves into "My sessions" and offers to give the seat up. The
    // transient confirmation is not asserted: it belongs to a component that
    // remounts when the card changes section.
    const employeeSeat = page.locator("main ul > li").filter({ hasText: title }).first();
    await expect(employeeSeat.getByRole("button", { name: /cancel my place/i })).toBeVisible({
      timeout: 20_000,
    });
    await signOut(page);

    // --- the second finds it full and joins the queue -----------------------
    await signIn(page, ACCOUNTS.newStarter.id);
    await page.goto("/sessions");
    const forStarter = page.locator("main ul > li").filter({ hasText: title }).first();
    await expect(forStarter).toBeVisible();
    await forStarter.getByRole("button", { name: /^register$/i }).click();
    const starterQueued = page.locator("main ul > li").filter({ hasText: title }).first();
    await expect(starterQueued.getByText(/waiting list/i)).toBeVisible({ timeout: 20_000 });
    await signOut(page);

    // --- the first gives the seat up, which must promote the second ---------
    await signIn(page, ACCOUNTS.employee.id);
    await page.goto("/sessions");
    const mine = page.locator("main ul > li").filter({ hasText: title }).first();
    await mine.getByRole("button", { name: /cancel my place/i }).click();
    // Seat given up: the card offers to register again.
    const released = page.locator("main ul > li").filter({ hasText: title }).first();
    await expect(released.getByRole("button", { name: /^register$/i })).toBeVisible({ timeout: 20_000 });
    await signOut(page);

    // --- and the promotion is real, not just a status string ----------------
    await signIn(page, ACCOUNTS.newStarter.id);
    await page.goto("/sessions");
    const promoted = page.locator("main ul > li").filter({ hasText: title }).first();
    await expect(promoted).toBeVisible();
    // No longer queued: the card now offers to give the seat up.
    await expect(promoted.getByRole("button", { name: /cancel my place/i })).toBeVisible();
    await expect(promoted.getByText(/waiting list/i)).toHaveCount(0);
    await signOut(page);

    // --- attendance credits the linked course -------------------------------
    await signIn(page, ACCOUNTS.superAdmin.id);
    await page.goto("/admin/sessions");
    await page.locator("tbody tr").filter({ hasText: title }).first().getByRole("link").first().click();
    await page.waitForURL(/\/admin\/sessions\/[^/]+$/, { timeout: 20_000 });

    // The person who cancelled is gone from the register; the promoted one is on it.
    const register = page.locator("tbody tr");
    await expect(register.filter({ hasText: ACCOUNTS.newStarter.name })).toHaveCount(1);
    await expect(register.filter({ hasText: ACCOUNTS.employee.name })).toHaveCount(0);

    await register
      .filter({ hasText: ACCOUNTS.newStarter.name })
      .first()
      .locator('input[type="checkbox"]')
      .check();
    await page.getByRole("button", { name: /save attendance/i }).click();
    await expect(page.getByText(/attendance recorded/i)).toBeVisible({ timeout: 20_000 });
    await signOut(page);

    // --- the learner's record shows the course as completed -----------------
    await signIn(page, ACCOUNTS.newStarter.id);
    await page.goto("/learning");
    const courseTitle = courseLabel.split("—").pop()!.trim();
    const enrolled = page.locator("main ul > li").filter({ hasText: courseTitle }).first();
    await expect(enrolled).toBeVisible({ timeout: 20_000 });
    await expect(enrolled.getByText(/completed/i).first()).toBeVisible();
  });

  test("a learner cannot be booked into two places at once", async ({ page }) => {
    const first = `${stamp()} A`;
    const second = `${stamp()} B`;
    const { start, end } = uniqueSlot();

    await signIn(page, ACCOUNTS.superAdmin.id);
    for (const title of [first, second]) {
      await page.goto("/admin/sessions/new");
      await page.locator('input[name="title"]').fill(title);
      await page.locator('input[name="startsAt"]').fill(localInput(start));
      await page.locator('input[name="endsAt"]').fill(localInput(end));
      await page.locator('input[name="capacity"]').fill("10");
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText(/^saved$/i).first()).toBeVisible({ timeout: 20_000 });
    }
    await signOut(page);

    await signIn(page, ACCOUNTS.manager.id);
    await page.goto("/sessions");
    await page.locator("main ul > li").filter({ hasText: first }).first()
      .getByRole("button", { name: /^register$/i })
      .click();
    await expect(
      page.locator("main ul > li").filter({ hasText: first }).first()
        .getByRole("button", { name: /cancel my place/i }),
    ).toBeVisible({ timeout: 20_000 });

    // The overlapping session must refuse, and name the conflict.
    const clashing = page.locator("main ul > li").filter({ hasText: second }).first();
    await clashing.getByRole("button", { name: /^register$/i }).click();
    await expect(clashing.getByText(/already booked/i)).toBeVisible({ timeout: 20_000 });
    await expect(clashing.getByText(first)).toBeVisible();
  });
});
