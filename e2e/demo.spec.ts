import { expect, test } from "@playwright/test";

test("opens the picker and exposes the responsive calendar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select date and time range" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("grid").first()).toBeVisible();
  await expect(page.getByTestId("dtrp-start-input")).toBeVisible();
});
