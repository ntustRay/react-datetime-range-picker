import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

async function enterText(input: Locator, text: string): Promise<void> {
  await input.focus();
  await input.fill(text);
  await input.press("Tab");
}

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
  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
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
  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
  await page.getByTestId("dtrp-trigger").first().click();
  const cells = page.locator('[data-testid^="dtrp-date-"]:visible');
  await cells.nth(10).click();
  await page.getByTestId("dtrp-next").click();
  await cells.nth(12).click();
  await expect(page.getByTestId("dtrp-apply")).toBeVisible();
});

test("a pointer range can cross into the next month", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-09T00:00:00.000Z"));
  await page.getByLabel("Locale").selectOption("en-US");
  const stage = page.locator(".picker-stage");

  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
  await stage.getByTestId("dtrp-trigger").click();
  await stage
    .getByRole("grid", { name: "August 2026" })
    .getByRole("gridcell", { name: "Monday, August 31, 2026" })
    .click();
  await stage.getByTestId("dtrp-next").click();
  await stage.getByTestId("dtrp-next-month").click();
  await stage
    .getByRole("grid", { name: "September 2026" })
    .getByRole("gridcell", { name: "Tuesday, September 1, 2026" })
    .click();
  await stage.getByTestId("dtrp-apply").click();

  await expect(stage.locator(".state-readout > div").nth(1)).not.toContainText(
    "No complete range",
  );
});

test("visible time scrollbar updates the selected hour", async ({ page }) => {
  const stage = page.locator(".picker-stage");
  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
  await stage.getByTestId("dtrp-trigger").click();
  await page.locator('[data-testid^="dtrp-date-"]:visible').nth(10).click();
  const scrollbar = stage.locator("[data-time-scrollbar]").first();
  const startInput = stage.getByTestId("dtrp-start-input");
  await expect(scrollbar).toBeVisible();
  await scrollbar.click({ position: { x: 4, y: 230 } });
  await expect(startInput).toHaveValue(/ 23:00:00$/);
});

test("text entry and Apply update the committed filter", async ({ page }) => {
  const stage = page.locator(".picker-stage");
  await enterText(stage.getByTestId("dtrp-start-input"), "2026/08/09 12:00:00");
  await enterText(stage.getByTestId("dtrp-end-input"), "2026/08/09 13:00:00");
  await stage.getByTestId("dtrp-apply").click();
  await expect(page.getByText(/Committed timestamps/)).toBeVisible();
});

test("changing the display time zone preserves range timestamps", async ({
  page,
}) => {
  const stage = page.locator(".picker-stage");
  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
  await enterText(stage.getByTestId("dtrp-start-input"), "2026/08/09 12:00:00");
  await enterText(stage.getByTestId("dtrp-end-input"), "2026/08/09 13:00:00");
  const draftValue = stage.locator(".state-readout code").first();
  await expect(draftValue).toContainText("startTimestamp=1786276800000");
  await expect(draftValue).toContainText("endTimestamp=1786280400000");
  const timestamps = await draftValue.textContent();

  await stage
    .getByRole("combobox", { name: "時區" })
    .selectOption("Asia/Taipei");

  await expect(draftValue).toHaveText(timestamps ?? "");
  await expect(stage.locator(".stage-label")).toContainText("Asia/Taipei");
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

test("disabled and read-only examples expose native control semantics", async ({
  page,
}) => {
  const disabledRange = page.getByRole("group", { name: "Disabled range" });
  await expect(
    disabledRange.getByRole("textbox", { name: "Start" }),
  ).toBeDisabled();
  await expect(
    disabledRange.getByRole("textbox", { name: "End" }),
  ).toBeDisabled();

  const readOnlyRange = page.getByRole("group", { name: "Read-only range" });
  await expect(
    readOnlyRange.getByRole("textbox", { name: "Start" }),
  ).toHaveAttribute("readonly", "");
  await expect(
    readOnlyRange.getByRole("textbox", { name: "End" }),
  ).toHaveAttribute("readonly", "");
  await expect(
    readOnlyRange.getByRole("button", { name: "Open calendar" }),
  ).toBeDisabled();
});

test("popover focus order follows its visual navigation order", async ({
  page,
}) => {
  const stage = page.locator(".picker-stage");
  await stage.getByTestId("dtrp-trigger").press("Enter");
  await expect(stage.getByTestId("dtrp-popover")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(stage.getByTestId("dtrp-previous-month")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(stage.getByRole("button", { name: /選擇年份/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(stage.getByRole("button", { name: /選擇月份/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(stage.getByTestId("dtrp-next-month")).toBeFocused();
});

test("calendar arrow keys move focus without scrolling the page", async ({
  page,
}) => {
  const stage = page.locator(".picker-stage");
  await stage.scrollIntoViewIfNeeded();
  await stage.getByTestId("dtrp-trigger").press("Enter");
  const cell = stage.locator('[role="gridcell"][tabindex="0"]');
  await cell.focus();
  const scrollBefore = await page.evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY,
  }));

  await cell.press("ArrowDown");
  await stage.locator('[role="gridcell"][tabindex="0"]').press("ArrowRight");

  expect(
    await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY })),
  ).toEqual(scrollBefore);
});

for (const zoom of [200, 400] as const) {
  test(`${zoom}% zoom equivalent keeps the picker usable without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280 / (zoom / 100), height: 720 });
    const stage = page.locator(".picker-stage");
    await page.getByRole("button", { name: "Clear draft timestamps" }).click();
    await stage.getByTestId("dtrp-trigger").click();
    const popover = stage.getByTestId("dtrp-popover");
    const bounds = await popover.boundingBox();

    expect(bounds).not.toBeNull();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
      1280 / (zoom / 100),
    );
    await stage.locator('[data-testid^="dtrp-date-"]:visible').nth(10).click();
    await expect(stage.getByTestId("dtrp-next")).toBeEnabled();
    await stage.getByTestId("dtrp-next").click();
    await stage.locator('[data-testid^="dtrp-date-"]:visible').nth(12).click();
    await stage.getByTestId("dtrp-apply").click();
    await expect(
      stage.locator(".state-readout > div").nth(1),
    ).not.toContainText("No complete range");
  });
}

for (const width of [320, 1280] as const) {
  test(`${width}px viewport keeps one usable calendar panel`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 720 });
    const stage = page.locator(".picker-stage");
    await stage.getByTestId("dtrp-trigger").click();

    await expect(stage.getByTestId("dtrp-calendar")).toHaveCount(1);
    const bounds = await stage.getByTestId("dtrp-popover").boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
  });
}

test("reduced motion disables the popover entrance animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stage = page.locator(".picker-stage");
  await stage.getByTestId("dtrp-trigger").click();

  await expect(stage.getByTestId("dtrp-popover")).toHaveCSS(
    "animation-name",
    "none",
  );
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

  await page.getByRole("button", { name: "Clear draft timestamps" }).click();

  await enterText(startInput, "not a date");
  await expect(stage.getByTestId("dtrp-validation")).toContainText(
    "請輸入有效的日期與時間。",
  );
  await expect(stage.getByTestId("dtrp-next")).toBeDisabled();

  await enterText(startInput, "2026/08/09 12:00:00");
  await enterText(endInput, "2026/08/09 12:00:00");
  await expect(stage.getByTestId("dtrp-validation")).toContainText(
    "結束時間必須晚於開始時間。",
  );
  await expect(stage.getByTestId("dtrp-apply")).toBeDisabled();
  await expect(page.getByText(/Committed timestamps/)).toBeVisible();
  await expect(stage.locator(".state-readout code").last()).toContainText(
    "startTimestamp=1786276800000",
  );
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

  await enterText(startInput, "2025/12/31 23:59:50");
  await expect(validation).toContainText("The value is before the minimum.");

  await enterText(startInput, "2026/01/01 00:00:00");
  await enterText(endInput, "2027/01/02 00:00:00");
  await expect(validation).toContainText("The value is after the maximum.");

  await enterText(endInput, "2026/01/09 00:00:00");
  await expect(validation).toContainText("The range is longer than allowed.");

  await enterText(startInput, "2026/01/01 00:01:01");
  await expect(validation).toContainText(
    "The minute does not match the required step.",
  );
  await expect(validation).toContainText(
    "The second does not match the required step.",
  );
  await expect(scenario.getByTestId("dtrp-apply")).toBeDisabled();
});

test("keyboard-only range selection commits and Escape restores focus", async ({
  page,
}) => {
  const stage = page.locator(".picker-stage");
  const trigger = stage.getByTestId("dtrp-trigger");

  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
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

  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
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
