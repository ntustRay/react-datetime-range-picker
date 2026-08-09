import { expect, test, type Page } from "@playwright/test";

const REFERENCE_NOW = new Date("2026-08-09T00:00:00.000Z");

async function openStableDemo(page: Page): Promise<void> {
  await page.clock.install({ time: REFERENCE_NOW });
  await page.goto("/");
}

test("desktop demo page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStableDemo(page);

  await expect(page).toHaveScreenshot("demo-desktop.png", {
    animations: "disabled",
    fullPage: true,
  });
});

test("mobile demo page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStableDemo(page);

  await expect(page).toHaveScreenshot("demo-mobile.png", {
    animations: "disabled",
    fullPage: true,
  });
});

test("desktop picker open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();

  await expect(page.locator(".playground-grid")).toHaveScreenshot(
    "picker-open-desktop.png",
    { animations: "disabled" },
  );
});

test("mobile picker open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();

  await expect(page.locator(".picker-stage")).toHaveScreenshot(
    "picker-open-mobile.png",
    { animations: "disabled" },
  );
});
