import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

test.describe("Shop", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
    await page.goto("/shop");
    await page.waitForURL("**/shop", { timeout: 5_000 });
    await expect(page.locator(".shop-card").first()).toBeVisible({ timeout: 5_000 });
  });

  test("shop page loads with items", async ({ page }) => {
    const count = await page.locator(".shop-card").count();
    expect(count).toBeGreaterThan(0);
    await expect(page.locator(".shop-balance-value").first()).toBeVisible();
  });

  test("buy cursor costing <= 200 coins decreases balance", async ({ page }) => {
    const initialCoins = parseInt(
      (await page.locator(".shop-balance-value").first().textContent()) ?? "0",
      10,
    );

    const nonOwned = page.locator(".shop-card:not(.shop-card--owned)").first();
    if ((await nonOwned.count()) === 0) {
      test.skip();
      return;
    }
    await nonOwned.click();
    await page.waitForURL("**/shop/**", { timeout: 5_000 });

    // Price is in the second .detail-stat-val ("50 монет")
    const priceText = (await page.locator(".detail-stat-val").nth(1).textContent()) ?? "0";
    const price = parseInt(priceText, 10);

    if (price > initialCoins) {
      test.skip();
      return;
    }

    await page.locator(".detail-buy-btn").click();

    // Balance updates on the detail page after purchase
    await expect(page.locator(".shop-balance-value").first()).not.toHaveText(
      String(initialCoins),
      { timeout: 5_000 },
    );
    const newCoins = parseInt(
      (await page.locator(".shop-balance-value").first().textContent()) ?? "0",
      10,
    );
    expect(newCoins).toBe(initialCoins - price);
  });

  test("already owned item shows disabled buy button", async ({ page }) => {
    const ownedCard = page.locator(".shop-card--owned").first();
    if ((await ownedCard.count()) === 0) {
      test.skip();
      return;
    }

    await ownedCard.click();
    await page.waitForURL("**/shop/**", { timeout: 5_000 });

    const buyBtn = page.locator(".detail-buy-btn");
    await expect(buyBtn).toBeDisabled();
    await expect(buyBtn).toHaveText("В инвентаре");
  });

  test("insufficient coins shows error", async ({ page }) => {
    const coins = parseInt(
      (await page.locator(".shop-balance-value").first().textContent()) ?? "0",
      10,
    );

    // Iterate non-owned cards to find one priced above current balance
    const cards = page.locator(".shop-card:not(.shop-card--owned)");
    const total = await cards.count();
    let foundExpensive = false;

    for (let i = 0; i < total && !foundExpensive; i++) {
      await cards.nth(i).click();
      await page.waitForURL("**/shop/**", { timeout: 5_000 });

      const priceText = (await page.locator(".detail-stat-val").nth(1).textContent()) ?? "0";
      const price = parseInt(priceText, 10);

      if (price > coins) {
        foundExpensive = true;
        await page.locator(".detail-buy-btn").click();
        await expect(page.locator(".detail-buy-err")).toBeVisible({ timeout: 5_000 });
      } else {
        await page.goto("/shop");
        await page.waitForURL("**/shop", { timeout: 5_000 });
        await expect(page.locator(".shop-card").first()).toBeVisible({ timeout: 5_000 });
      }
    }

    if (!foundExpensive) test.skip();
  });
});
