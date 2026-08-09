import { expect, test } from "@playwright/test";

test("opens the picker and exposes the responsive calendar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select date and time range" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("grid").first()).toBeVisible();
  await expect(page.getByTestId("dtrp-start-input")).toBeVisible();
});

test("playground exposes every public precision and controls the timezone", async ({ page }) => {
  await page.goto("/");
  const precision = page.getByLabel("Precision");
  await expect(precision.locator("option")).toHaveText([
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "millisecond",
  ]);

  await page.getByTestId("dtrp-trigger").first().click();
  await page.getByTestId("dtrp-timezone").selectOption("Asia/Taipei");
  await expect(page.getByText("Asia/Taipei", { exact: true }).first()).toBeVisible();
});

test("feature examples expose text-only and calendar-only modes", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Enter exact range" }).click();
  const textDialog = page.getByRole("dialog", { name: "Enter exact range" });
  await expect(textDialog.getByTestId("dtrp-start-input")).toBeVisible();
  await expect(textDialog.getByRole("grid")).toHaveCount(0);
  await textDialog.getByTestId("dtrp-cancel").click();

  await page.getByRole("button", { name: "Choose reporting days" }).click();
  const calendarDialog = page.getByRole("dialog", { name: "Choose reporting days" });
  await expect(calendarDialog.getByRole("grid").first()).toBeVisible();
  await expect(calendarDialog.getByRole("textbox")).toHaveCount(0);
});

test("playground reports required validation and invalid case explains failure", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Required").check();
  await page.getByTestId("dtrp-trigger").first().click();
  await expect(page.getByTestId("dtrp-validation").first()).toContainText("required");
  await page.getByTestId("dtrp-cancel").first().click();

  await page.getByRole("button", { name: "Invalid controlled value" }).click();
  await expect(page.getByText("End must be after start.")).toBeVisible();
});
