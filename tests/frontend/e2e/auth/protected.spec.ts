import { test, expect } from "@playwright/test";

// RequireAuth in App.tsx redirects unauthenticated users to /register
test.describe("Protected routes (no token)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("access_token");
    });
  });

  test("/main redirects to /register", async ({ page }) => {
    await page.goto("/main");
    await page.waitForURL("**/register", { timeout: 10_000 });
    await expect(page).toHaveURL("/register");
  });

  test("/profile redirects to /register", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL("**/register", { timeout: 10_000 });
    await expect(page).toHaveURL("/register");
  });

  test("/shop redirects to /register", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForURL("**/register", { timeout: 10_000 });
    await expect(page).toHaveURL("/register");
  });
});
