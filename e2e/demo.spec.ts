import { expect, test } from "@playwright/test";

test("opens the picker and exposes exactly one calendar month", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "開啟日曆" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("grid").first()).toBeVisible();
  const grids = page.getByRole("grid").filter({ visible: true });
  await expect(grids).toHaveCount(1);
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

test("demo language selection supplies Japanese formatting and wording", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Locale").selectOption("ja-JP");

  await page.getByRole("button", { name: "カレンダーを開く" }).click();

  await expect(page.getByRole("region", { name: "カレンダー" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "開始", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "次へ" })).toBeVisible();
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

  const textScenario = page.locator(".scenario-card").filter({ hasText: "Text-only toolbar" });
  await textScenario.getByRole("button", { name: "Open calendar" }).click();
  const textDialog = textScenario.getByRole("dialog", { name: "Enter exact range" });
  await expect(textDialog.getByRole("grid")).toHaveCount(0);
  await textDialog.getByTestId("dtrp-cancel").click();

  const calendarScenario = page.locator(".scenario-card").filter({ hasText: "Calendar-only selection" });
  await calendarScenario.getByRole("button", { name: "Open calendar" }).click();
  const calendarDialog = calendarScenario.getByRole("dialog", { name: "Choose reporting days" });
  await expect(calendarDialog.getByRole("grid").first()).toBeVisible();
  await expect(calendarScenario.getByRole("textbox")).toHaveCount(2);
});

test("constrained preset produces a complete draft", async ({ page }) => {
  await page.goto("/");
  await page.clock.setFixedTime(new Date("2026-08-09T00:00:00.000Z"));
  const scenario = page.locator(".scenario-card").filter({ hasText: "Guardrailed reporting window" });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  const dialog = page.getByRole("dialog", { name: "Constrained range" });
  await dialog.getByTestId("dtrp-preset-today").click();
  await expect(scenario.getByTestId("dtrp-start-input")).not.toHaveValue("");
  await expect(scenario.getByTestId("dtrp-end-input")).not.toHaveValue("");
  await expect(dialog.getByTestId("dtrp-next")).toBeEnabled();
});

test("playground reports required validation and invalid case explains failure", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Required").check();
  await page.getByTestId("dtrp-trigger").first().click();
  await expect(page.getByTestId("dtrp-validation").first()).toContainText(
    "請選擇日期與時間範圍。",
  );
  await page.getByTestId("dtrp-cancel").first().click();

  const invalidScenario = page.locator(".scenario-card").filter({ hasText: "Invalid controlled range" });
  await invalidScenario.getByRole("button", { name: "Open calendar" }).click();
  await expect(page.getByText("End must be after start.")).toBeVisible();
});

test("DST examples expose gap and overlap guidance", async ({ page }) => {
  await page.goto("/");

  const gapScenario = page.locator(".scenario-card").filter({ hasText: "Spring-forward gap" });
  await gapScenario.getByRole("button", { name: "Open calendar" }).click();
  let dialog = page.getByRole("dialog", { name: "DST gap example" });
  await gapScenario.getByTestId("dtrp-start-input").fill("2024/03/10 02:30:00");
  await gapScenario.getByTestId("dtrp-start-input").blur();
  await expect(dialog).toContainText("This local time does not exist.");
  await dialog.getByTestId("dtrp-cancel").click();

  const overlapScenario = page.locator(".scenario-card").filter({ hasText: "Fall-back overlap" });
  await overlapScenario.getByRole("button", { name: "Open calendar" }).click();
  dialog = page.getByRole("dialog", { name: "DST overlap example" });
  await overlapScenario.getByTestId("dtrp-start-input").fill("2024/11/03 01:30:00");
  await overlapScenario.getByTestId("dtrp-start-input").blur();
  await expect(dialog.getByRole("combobox", { name: "Start offset" })).toBeVisible();
});
