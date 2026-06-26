import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

test.describe("Logout", () => {
  test("logout redirects to /login and /main becomes protected again", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL("/main", { timeout: 10_000 });

    // Logout via header button
    await page.locator("button.nav-cta", { hasText: "Выйти" }).click();
    await expect(page).toHaveURL("/register", { timeout: 5_000 });

    // /main should now be guarded again
    await page.goto("/main");
    await expect(page).toHaveURL("/register", { timeout: 5_000 });
  });
});
