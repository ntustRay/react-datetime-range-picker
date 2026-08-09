import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("default IDs support opening, resetting, and cancelling", async ({
  page,
}) => {
  const trigger = page.getByTestId("dtrp-trigger").first();
  await trigger.click();
  await expect(page.getByTestId("dtrp-popover")).toBeVisible();
  await page.getByTestId("dtrp-reset").click();
  await page.getByTestId("dtrp-cancel").click();
  await expect(page.getByTestId("dtrp-popover")).toHaveCount(0);
});

test("keyboard calendar selection works in the production demo", async ({
  page,
}) => {
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.first().press("Enter");
  await page.getByTestId("dtrp-next").click();
  await cells.nth(1).press("Space");
  await expect(page.getByTestId("dtrp-apply")).toBeVisible();
});

test("pointer calendar selection works in the production demo", async ({
  page,
}) => {
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(10).click();
  await page.getByTestId("dtrp-next").click();
  await cells.nth(12).click();
  await expect(page.getByTestId("dtrp-apply")).toBeVisible();
});

test("visible time scrollbar updates the selected hour", async ({ page }) => {
  const stage = page.locator(".picker-stage");
  await stage.getByTestId("dtrp-trigger").click();
  await page.locator('[data-testid^="dtrp-date-"]:visible').nth(10).click();
  const scrollbar = stage.locator("[data-time-scrollbar]").first();
  await expect(scrollbar).toBeVisible();
  await scrollbar.click({ position: { x: 4, y: 126 } });
  await expect(stage.getByTestId("dtrp-start-input")).toHaveValue(/ 11:00:00$/);
});

test("text entry and Apply update the committed filter", async ({ page }) => {
  const stage = page.locator(".picker-stage");
  await stage.getByTestId("dtrp-start-input").fill("2026/08/09 12:00:00");
  await stage.getByTestId("dtrp-start-input").blur();
  await stage.getByTestId("dtrp-end-input").fill("2026/08/09 13:00:00");
  await stage.getByTestId("dtrp-end-input").blur();
  await stage.getByTestId("dtrp-apply").click();
  await expect(page.getByText(/Committed chart filter/)).toBeVisible();
});

test("disabled and read-only examples cannot open", async ({ page }) => {
  const scenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Unavailable controls" });
  await expect(
    scenario.getByRole("button", { name: "Open calendar" }),
  ).toHaveCount(2);
  for (const button of await scenario
    .getByRole("button", { name: "Open calendar" })
    .all()) {
    await expect(button).toBeDisabled();
  }
});

test("custom test ID override is present", async ({ page }) => {
  await expect(page.getByTestId("dtrp-constrained")).toBeVisible();
});

test("invalid text and a non-increasing range cannot commit", async ({
  page,
}) => {
  const stage = page.locator(".picker-stage");
  const startInput = stage.getByTestId("dtrp-start-input");
  const endInput = stage.getByTestId("dtrp-end-input");

  await startInput.fill("not a date");
  await startInput.blur();
  await expect(stage.getByTestId("dtrp-validation")).toContainText(
    "請輸入有效的日期與時間。",
  );
  await expect(stage.getByTestId("dtrp-next")).toBeDisabled();

  await startInput.fill("2026/08/09 12:00:00");
  await startInput.blur();
  await endInput.fill("2026/08/09 12:00:00");
  await endInput.blur();
  await expect(stage.getByTestId("dtrp-validation")).toContainText(
    "結束時間必須晚於開始時間。",
  );
  await expect(stage.getByTestId("dtrp-apply")).toBeDisabled();
  await expect(page.getByText(/Committed chart filter/)).toBeVisible();
  await expect(page.getByText("No complete range").last()).toBeVisible();
});

test("constraint violations remain visible and cannot commit", async ({
  page,
}) => {
  const scenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Guardrailed reporting window" });
  const startInput = scenario.getByTestId("dtrp-start-input");
  const endInput = scenario.getByTestId("dtrp-end-input");
  const validation = scenario.getByTestId("dtrp-validation");

  await startInput.fill("2025/12/31 23:59:50");
  await startInput.blur();
  await expect(validation).toContainText("The value is before the minimum.");

  await startInput.fill("2026/01/01 00:00:00");
  await startInput.blur();
  await endInput.fill("2027/01/02 00:00:00");
  await endInput.blur();
  await expect(validation).toContainText("The value is after the maximum.");

  await endInput.fill("2026/01/09 00:00:00");
  await endInput.blur();
  await expect(validation).toContainText("The range is longer than allowed.");

  await startInput.fill("2026/01/01 00:01:01");
  await startInput.blur();
  await expect(validation).toContainText(
    "The minute does not match the required step.",
  );
  await expect(validation).toContainText(
    "The second does not match the required step.",
  );
  await expect(scenario.getByTestId("dtrp-next")).toBeDisabled();
});

test("keyboard-only range selection commits and Escape restores focus", async ({
  page,
}) => {
  const stage = page.locator(".picker-stage");
  const trigger = stage.getByTestId("dtrp-trigger");

  await trigger.press("Enter");
  const dialog = stage.getByTestId("dtrp-popover");
  await expect(dialog).toBeFocused();

  let cells = stage.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(10).press("Enter");
  await stage.getByTestId("dtrp-next").press("Enter");
  cells = stage.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(12).press("Space");
  await stage.getByTestId("dtrp-apply").press("Enter");
  await expect(stage.locator(".state-readout > div").nth(1)).not.toContainText(
    "No complete range",
  );

  await trigger.press("Enter");
  await page.keyboard.press("Escape");
  await expect(stage.getByTestId("dtrp-end-input")).toBeFocused();
  await expect(dialog).toHaveCount(0);
});

test("day, year, and month grids expose every keyboard navigation path", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-08-09T00:00:00.000Z"));
  await page.getByLabel("Locale").selectOption("en-US");
  const stage = page.locator(".picker-stage");
  const trigger = stage.getByTestId("dtrp-trigger");

  await trigger.press("Enter");
  let grid = stage.getByRole("grid", { name: "August 2026" });
  let focusedCell = grid.locator('[role="gridcell"][tabindex="0"]');
  await focusedCell.press("ArrowDown");
  await expect(grid.locator('[role="gridcell"][tabindex="0"]')).toBeFocused();
  focusedCell = grid.locator('[role="gridcell"][tabindex="0"]');
  await focusedCell.press("ArrowUp");
  await grid.locator('[role="gridcell"][tabindex="0"]').press("ArrowLeft");
  await grid.locator('[role="gridcell"][tabindex="0"]').press("ArrowRight");
  await focusedCell.press("Home");
  await grid.locator('[role="gridcell"][tabindex="0"]').press("End");
  await grid.locator('[role="gridcell"][tabindex="0"]').press("PageDown");
  await expect(
    stage.getByRole("grid", { name: "September 2026" }),
  ).toBeVisible();
  await stage
    .getByRole("grid", { name: "September 2026" })
    .locator('[role="gridcell"][tabindex="0"]')
    .press("PageUp");

  await stage.getByRole("button", { name: "Choose year: 2026" }).press("Enter");
  grid = stage.getByRole("grid", { name: "Choose year" });
  await grid.locator('[role="gridcell"][tabindex="0"]').press("ArrowLeft");
  await expect(grid.getByRole("gridcell", { name: "2025" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "2025" }).press("ArrowRight");
  await grid.getByRole("gridcell", { name: "2026" }).press("ArrowUp");
  await expect(grid.getByRole("gridcell", { name: "2023" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "2023" }).press("ArrowDown");
  await grid.getByRole("gridcell", { name: "2026" }).press("Home");
  await grid.locator('[role="gridcell"][tabindex="0"]').press("End");
  await expect(grid.getByRole("gridcell", { name: "2032" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "2032" }).press("PageDown");
  grid = stage.getByRole("grid", { name: "Choose year" });
  await expect(grid.getByRole("gridcell", { name: "2033" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "2033" }).press("PageUp");
  await expect(
    stage
      .getByRole("grid", { name: "Choose year" })
      .getByRole("gridcell", { name: "2026" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");

  await trigger.press("Enter");
  await stage
    .getByRole("button", { name: "Choose month: August" })
    .press("Enter");
  grid = stage.getByRole("grid", { name: "Choose month" });
  await grid.locator('[role="gridcell"][tabindex="0"]').press("ArrowLeft");
  await expect(grid.getByRole("gridcell", { name: "July" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "July" }).press("ArrowRight");
  await grid.getByRole("gridcell", { name: "August" }).press("ArrowUp");
  await expect(grid.getByRole("gridcell", { name: "May" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "May" }).press("ArrowDown");
  await grid.locator('[role="gridcell"][tabindex="0"]').press("ArrowRight");
  await expect(grid.getByRole("gridcell", { name: "September" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "September" }).press("Home");
  await expect(grid.getByRole("gridcell", { name: "January" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "January" }).press("End");
  await expect(grid.getByRole("gridcell", { name: "December" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "December" }).press("PageDown");
  grid = stage.getByRole("grid", { name: "Choose month" });
  await expect(grid.getByRole("gridcell", { name: "August" })).toBeFocused();
  await grid.getByRole("gridcell", { name: "August" }).press("PageUp");
  await expect(
    stage
      .getByRole("grid", { name: "Choose month" })
      .getByRole("gridcell", { name: "August" }),
  ).toBeFocused();
});
