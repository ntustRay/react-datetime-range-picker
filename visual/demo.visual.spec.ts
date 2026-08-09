import { expect, test, type Page } from "@playwright/test";

const REFERENCE_NOW = new Date("2026-08-09T00:00:00.000Z");

async function openStableDemo(page: Page): Promise<void> {
  await page.clock.setFixedTime(REFERENCE_NOW);
  await page.goto("/");
}

async function clearPointerHover(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
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
  await clearPointerHover(page);

  await expect(page.locator(".playground-grid")).toHaveScreenshot(
    "picker-open-desktop.png",
    { animations: "disabled" },
  );
});

test("mobile picker open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();
  await clearPointerHover(page);

  await expect(page.locator(".picker-stage")).toHaveScreenshot(
    "picker-open-mobile.png",
    { animations: "disabled" },
  );
});

test("desktop selected range", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(10).click();
  await page.getByTestId("dtrp-next").click();
  await cells.nth(14).click();
  await clearPointerHover(page);

  await expect(page.locator(".picker-stage")).toHaveScreenshot(
    "picker-selected-desktop.png",
    { animations: "disabled" },
  );
});

test("End target keeps the selected Start marker", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();
  await page.locator('[data-testid^="dtrp-date-"]:visible').nth(10).click();
  await page.getByTestId("dtrp-next").click();
  await clearPointerHover(page);

  await expect(page.locator(".picker-stage")).toHaveScreenshot(
    "picker-end-target-draft.png",
    { animations: "disabled" },
  );
});

test("mobile selected range", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(10).click();
  await page.getByTestId("dtrp-next").click();
  await cells.nth(14).click();
  await clearPointerHover(page);

  await expect(page.locator(".picker-stage")).toHaveScreenshot(
    "picker-selected-mobile.png",
    { animations: "disabled" },
  );
});

test("dark picker", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await openStableDemo(page);
  await page.getByLabel("Theme").selectOption("dark");
  await page.getByTestId("dtrp-trigger").first().click();
  await clearPointerHover(page);

  await expect(page.getByTestId("dtrp-popover").first()).toHaveScreenshot(
    "picker-open-dark.png",
    { animations: "disabled" },
  );
});

test("high contrast picker", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.emulateMedia({ forcedColors: "active" });
  await openStableDemo(page);
  await page.getByTestId("dtrp-trigger").first().click();
  await clearPointerHover(page);

  await expect(page.getByTestId("dtrp-popover").first()).toHaveScreenshot(
    "picker-open-high-contrast.png",
    { animations: "disabled" },
  );
});

test("millisecond and 12-hour columns", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStableDemo(page);
  await page.getByLabel("Precision").selectOption("millisecond");
  await page.getByTestId("dtrp-trigger").first().click();
  await page.getByTestId("dtrp-hour-cycle").selectOption("h12");
  await expect(page.getByTestId("dtrp-millisecond-column")).toBeVisible();
  await expect(page.getByTestId("dtrp-period-column")).toBeVisible();
  await clearPointerHover(page);

  await expect(page.locator(".picker-stage")).toHaveScreenshot(
    "picker-millisecond-h12.png",
    { animations: "disabled" },
  );
});

test("constrained preset", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await openStableDemo(page);
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Guardrailed reporting window",
  });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await scenario.getByTestId("dtrp-preset-today").click();
  await expect(scenario.getByTestId("dtrp-start-input")).not.toHaveValue("");
  await expect(scenario.getByTestId("dtrp-next")).toBeEnabled();
  await clearPointerHover(page);

  await expect(scenario).toHaveScreenshot("scenario-constrained-preset.png", {
    animations: "disabled",
  });
});

test("text-only mode", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await openStableDemo(page);
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Text-only toolbar",
  });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await clearPointerHover(page);

  await expect(scenario).toHaveScreenshot("scenario-text-only.png", {
    animations: "disabled",
  });
});

test("calendar-only mode", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await openStableDemo(page);
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Calendar-only selection",
  });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await clearPointerHover(page);

  await expect(scenario).toHaveScreenshot("scenario-calendar-only.png", {
    animations: "disabled",
  });
});

test("invalid controlled range", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await openStableDemo(page);
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Invalid controlled range",
  });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await clearPointerHover(page);

  await expect(scenario).toHaveScreenshot("scenario-invalid-range.png", {
    animations: "disabled",
  });
});

test("DST gap validation", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await openStableDemo(page);
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Spring-forward gap",
  });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await scenario.getByTestId("dtrp-start-input").fill("2024/03/10 02:30:00");
  await scenario.getByTestId("dtrp-start-input").blur();
  await clearPointerHover(page);

  await expect(scenario).toHaveScreenshot("scenario-dst-gap.png", {
    animations: "disabled",
  });
});

test("DST overlap validation", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await openStableDemo(page);
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Fall-back overlap",
  });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await scenario.getByTestId("dtrp-start-input").fill("2024/11/03 01:30:00");
  await scenario.getByTestId("dtrp-start-input").blur();
  await clearPointerHover(page);

  await expect(scenario).toHaveScreenshot("scenario-dst-overlap.png", {
    animations: "disabled",
  });
});
