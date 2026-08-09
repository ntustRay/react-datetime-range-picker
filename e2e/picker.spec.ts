import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("default IDs support opening, clearing, and cancelling", async ({ page }) => {
  const trigger = page.getByTestId("dtrp-trigger").first();
  await trigger.click();
  await expect(page.getByTestId("dtrp-popover")).toBeVisible();
  await page.getByTestId("dtrp-clear").click();
  await page.getByTestId("dtrp-cancel").click();
  await expect(page.getByTestId("dtrp-popover")).toHaveCount(0);
});

test("keyboard calendar selection works in the production demo", async ({ page }) => {
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.first().press("Enter");
  await cells.nth(1).press("Space");
  await expect(page.getByTestId("dtrp-apply")).toBeVisible();
});

test("pointer calendar selection works in the production demo", async ({ page }) => {
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(10).click();
  await cells.nth(12).click();
  await expect(page.getByTestId("dtrp-apply")).toBeVisible();
});

test("text entry and Apply update the committed filter", async ({ page }) => {
  await page.getByTestId("dtrp-trigger").first().click();
  const dialog = page.getByTestId("dtrp-popover").first();
  await dialog.getByTestId("dtrp-start-input").fill("2026-08-09 12:00:00");
  await dialog.getByTestId("dtrp-end-input").fill("2026-08-09 13:00:00");
  await dialog.getByTestId("dtrp-end-input").blur();
  await dialog.getByTestId("dtrp-apply").click();
  await expect(page.getByText(/Committed chart filter/)).toBeVisible();
});

test("disabled and read-only examples cannot open", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Disabled range" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Read-only range" })).toBeDisabled();
});

test("custom test ID override is present", async ({ page }) => {
  await expect(page.getByTestId("dtrp-constrained")).toBeVisible();
});
