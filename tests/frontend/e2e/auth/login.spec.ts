import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await expect(page.locator("h1.auth-title")).toHaveText("Вход");
  });

  test("valid credentials redirect to /main and show username in header", async ({ page }) => {
    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL("/main", { timeout: 10_000 });
    await expect(page.locator("a.nav-username")).toBeVisible();
  });

  test("wrong password shows error message", async ({ page }) => {
    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[name="password"]').fill("WrongPassword999");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator(".auth-server-error")).toBeVisible({ timeout: 10_000 });
  });
});
