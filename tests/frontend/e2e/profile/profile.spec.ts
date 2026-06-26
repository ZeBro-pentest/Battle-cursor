import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
  });

  test("profile shows username, rating and coins", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL("**/profile", { timeout: 5_000 });

    await expect(page.locator(".profile-username")).toBeVisible();
    await expect(page.locator(".profile-stat-value").first()).toBeVisible(); // rating
    await expect(page.locator(".profile-stat-value--coins")).toBeVisible();  // coins
  });

  test("inventory page loads from profile link", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL("**/profile", { timeout: 5_000 });

    await page.locator("a.profile-btn").click();
    await page.waitForURL("**/inventory", { timeout: 5_000 });

    await expect(page.locator(".shop-title")).toHaveText("ИНВЕНТАРЬ");
  });

  test("equip cursor from inventory updates profile", async ({ page }) => {
    await page.goto("/inventory");
    await page.waitForURL("**/inventory", { timeout: 5_000 });

    // Find the first real cursor card (skip the "Снять" NoneCard)
    const cursorCard = page
      .locator(".inv-card")
      .filter({ hasNot: page.locator('.inv-card-name:text("Снять")') })
      .first();

    if ((await cursorCard.count()) === 0) {
      test.skip(); // No cursors in inventory
      return;
    }

    const cursorName = (await cursorCard.locator(".inv-card-name").textContent()) ?? "";

    await cursorCard.click();
    await expect(cursorCard).toHaveClass(/equipped/);

    await page.locator("button.profile-btn").click();
    await expect(page.locator(".inv-save-msg")).toHaveText("Сохранено", { timeout: 5_000 });

    await page.goto("/profile");
    await page.waitForURL("**/profile", { timeout: 5_000 });

    // First .equip-name is the cursor slot
    await expect(page.locator(".equip-name").first()).toHaveText(cursorName);
  });
});
