import { expect, test } from "@playwright/test";

test("opens the picker and exposes the responsive calendar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select date and time range" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("grid").first()).toBeVisible();
  await expect(page.getByTestId("dtrp-start-input")).toBeVisible();
  const grids = page.getByRole("grid").filter({ visible: true });
  const firstCalendar = await grids.nth(0).boundingBox();
  const secondCalendar = await grids.nth(1).boundingBox();
  expect(firstCalendar).not.toBeNull();
  expect(secondCalendar).not.toBeNull();
  expect(secondCalendar?.x).toBeGreaterThan(firstCalendar?.x ?? 0);
  expect(Math.abs((secondCalendar?.y ?? 0) - (firstCalendar?.y ?? 0))).toBeLessThan(4);
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

test("public CSS custom properties remain available to consumers", async ({ page }) => {
  await page.goto("/");
  const values = await page.getByTestId("dtrp-root").first().evaluate((root) => {
    const styles = getComputedStyle(root);
    return [
      "--dtrp-space",
      "--dtrp-radius",
      "--dtrp-disabled-opacity",
    ].map((property) => styles.getPropertyValue(property).trim());
  });

  expect(values.every((value) => value !== "")).toBe(true);
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

test("constrained preset produces a complete draft", async ({ page }) => {
  await page.goto("/");
  await page.clock.setFixedTime(new Date("2026-08-09T00:00:00.000Z"));
  await page.getByRole("button", { name: "Constrained range" }).click();
  const dialog = page.getByRole("dialog", { name: "Constrained range" });
  await dialog.getByTestId("dtrp-preset-today").click();
  await expect(dialog.getByTestId("dtrp-start-input")).not.toHaveValue("");
  await expect(dialog.getByTestId("dtrp-end-input")).not.toHaveValue("");
  await expect(dialog.getByTestId("dtrp-apply")).toBeEnabled();
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

test("DST examples expose gap and overlap guidance", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "DST gap example" }).click();
  let dialog = page.getByRole("dialog", { name: "DST gap example" });
  await dialog.getByTestId("dtrp-start-input").fill("2024-03-10 02:30:00");
  await dialog.getByTestId("dtrp-start-input").blur();
  await expect(dialog).toContainText("This local time does not exist.");
  await dialog.getByTestId("dtrp-cancel").click();

  await page.getByRole("button", { name: "DST overlap example" }).click();
  dialog = page.getByRole("dialog", { name: "DST overlap example" });
  await dialog.getByTestId("dtrp-start-input").fill("2024-11-03 01:30:00");
  await dialog.getByTestId("dtrp-start-input").blur();
  await expect(dialog.getByRole("combobox", { name: "Start offset" })).toBeVisible();
});
