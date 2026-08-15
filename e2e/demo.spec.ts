import { expect, test } from "@playwright/test";

interface LocaleExpectation {
  locale: string;
  calendarButton: string;
  calendar: string;
  previousMonth: string;
  start: string;
  next: string;
  cancel: string;
}

const LOCALE_EXPECTATIONS: readonly LocaleExpectation[] = [
  {
    locale: "en-US",
    calendarButton: "Open calendar",
    calendar: "Calendar",
    previousMonth: "Previous month",
    start: "Start",
    next: "Next",
    cancel: "Cancel",
  },
  {
    locale: "zh-TW",
    calendarButton: "開啟日曆",
    calendar: "日曆",
    previousMonth: "上個月",
    start: "開始",
    next: "下一步",
    cancel: "取消",
  },
  {
    locale: "zh-CN",
    calendarButton: "打开日历",
    calendar: "日历",
    previousMonth: "上个月",
    start: "开始",
    next: "下一步",
    cancel: "取消",
  },
  {
    locale: "ja-JP",
    calendarButton: "カレンダーを開く",
    calendar: "カレンダー",
    previousMonth: "前の月",
    start: "開始",
    next: "次へ",
    cancel: "キャンセル",
  },
  {
    locale: "ko-KR",
    calendarButton: "달력 열기",
    calendar: "달력",
    previousMonth: "이전 달",
    start: "시작",
    next: "다음",
    cancel: "취소",
  },
  {
    locale: "es-ES",
    calendarButton: "Abrir calendario",
    calendar: "Calendario",
    previousMonth: "Mes anterior",
    start: "Inicio",
    next: "Siguiente",
    cancel: "Cancelar",
  },
  {
    locale: "fr-FR",
    calendarButton: "Ouvrir le calendrier",
    calendar: "Calendrier",
    previousMonth: "Mois précédent",
    start: "Début",
    next: "Suivant",
    cancel: "Annuler",
  },
  {
    locale: "de-DE",
    calendarButton: "Kalender öffnen",
    calendar: "Kalender",
    previousMonth: "Vorheriger Monat",
    start: "Start",
    next: "Weiter",
    cancel: "Abbrechen",
  },
  {
    locale: "pt-BR",
    calendarButton: "Abrir calendário",
    calendar: "Calendário",
    previousMonth: "Mês anterior",
    start: "Início",
    next: "Próximo",
    cancel: "Cancelar",
  },
  {
    locale: "ru-RU",
    calendarButton: "Открыть календарь",
    calendar: "Календарь",
    previousMonth: "Предыдущий месяц",
    start: "Начало",
    next: "Далее",
    cancel: "Отмена",
  },
];

test("opens the picker and exposes exactly one calendar month", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "開啟日曆" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("grid").first()).toBeVisible();
  const grids = page.getByRole("grid").filter({ visible: true });
  await expect(grids).toHaveCount(1);
  await expect(page.locator(".dtrp-time-column-label")).toHaveText([
    "HH",
    "MM",
    "SS",
  ]);
  const timeColumnStyle = await page
    .getByTestId("dtrp-hour-column")
    .evaluate((column) => {
      const style = getComputedStyle(column);
      return { overflowY: style.overflowY, paddingTop: style.paddingTop };
    });
  expect(timeColumnStyle).toEqual({ overflowY: "scroll", paddingTop: "0px" });
  await expect(page.locator("[data-time-scrollbar]")).toHaveCount(3);
});

test("opening the picker floats above the page without moving later content", async ({
  page,
}) => {
  await page.goto("/");
  const laterSection = page.getByRole("heading", {
    name: "Production scenarios",
  });
  const before = await laterSection.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );

  await page.getByTestId("dtrp-trigger").first().click();
  const after = await laterSection.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );

  expect(before).toBe(after);
  await expect(page.getByTestId("dtrp-popover")).toHaveCSS(
    "position",
    "absolute",
  );
});

test("scenario pickers can render inline without covering later examples", async ({
  page,
}) => {
  await page.goto("/");
  const scenario = page.locator(".scenario-card").filter({
    hasText: "Guardrailed reporting window",
  });
  const laterScenario = page.locator(".scenario-card").filter({
    hasText: "Calendar-only selection",
  });
  const before = await laterScenario.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );

  await scenario.getByRole("button", { name: "Open calendar" }).click();
  await expect(scenario.getByRole("dialog")).toHaveCSS("position", "static");
  const after = await laterScenario.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );

  expect(after).toBeGreaterThan(before);
});

test("playground exposes every public precision and controls the timezone", async ({
  page,
}) => {
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
  await expect(page.locator(".state-readout code").first()).toContainText(
    "startTimestamp=1786276800000",
  );
  await expect(page.locator(".state-readout code").first()).toContainText(
    "endTimestamp=1786282200000",
  );
  await expect(page.locator(".state-readout code").first()).toContainText(
    "[start, end)",
  );

  await page.getByTestId("dtrp-trigger").first().click();
  await page.getByTestId("dtrp-timezone").selectOption("Asia/Taipei");
  await expect(page.locator(".stage-label")).toContainText(
    "Asia/Taipei · light",
  );
  await expect(page.getByLabel("Theme")).toHaveValue("light");
  await page.getByLabel("Theme").selectOption("dark");
  await expect(page.getByTestId("dtrp-root").first()).toHaveAttribute(
    "data-color-scheme",
    "dark",
  );
});

test("demo language selection supplies all built-in interface languages", async ({
  page,
}) => {
  await page.goto("/");
  const playground = page.getByRole("region", {
    name: "Edit the time. Keep the timestamps.",
  });

  for (const expectation of LOCALE_EXPECTATIONS) {
    await playground.getByLabel("Locale").selectOption(expectation.locale);
    await playground
      .getByRole("button", { name: expectation.calendarButton })
      .click();

    await expect(
      playground.getByRole("region", { name: expectation.calendar }),
    ).toBeVisible();
    await expect(
      playground.getByTestId("dtrp-previous-month"),
    ).toHaveAccessibleName(expectation.previousMonth);
    await expect(
      playground.getByRole("textbox", {
        name: expectation.start,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      playground.getByRole("button", {
        name: expectation.next,
        exact: true,
      }),
    ).toBeVisible();

    await playground.getByRole("button", { name: expectation.cancel }).click();
  }
});

test("long built-in labels remain inside a narrow picker", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const playground = page.getByRole("region", {
    name: "Edit the time. Keep the timestamps.",
  });

  for (const locale of ["de-DE", "fr-FR", "ru-RU"]) {
    const expectation = LOCALE_EXPECTATIONS.find(
      (candidate) => candidate.locale === locale,
    );
    expect(expectation).toBeDefined();
    if (expectation === undefined) continue;

    await playground.getByLabel("Locale").selectOption(locale);
    await playground
      .getByRole("button", { name: expectation.calendarButton })
      .click();

    const popover = playground.getByTestId("dtrp-popover");
    await expect(popover).toBeVisible();
    const overflow = await popover.evaluate((element) => ({
      horizontal: element.scrollWidth > element.clientWidth,
      clippedLabels: Array.from(element.querySelectorAll("button, label")).some(
        (label) => label.scrollWidth > label.clientWidth,
      ),
    }));
    expect(overflow).toEqual({ horizontal: false, clippedLabels: false });

    await playground.getByRole("button", { name: expectation.cancel }).click();
  }
});

test("public CSS custom properties remain available to consumers", async ({
  page,
}) => {
  await page.goto("/");
  const values = await page
    .getByTestId("dtrp-root")
    .first()
    .evaluate((root) => {
      const styles = getComputedStyle(root);
      return ["--dtrp-space", "--dtrp-radius", "--dtrp-disabled-opacity"].map(
        (property) => styles.getPropertyValue(property).trim(),
      );
    });

  expect(values.every((value) => value !== "")).toBe(true);
});

test("range inputs have no default outline", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("dtrp-start-input").first()).toHaveCSS(
    "outline-style",
    "none",
  );
});

test("quick start example exposes readable TSX syntax tokens", async ({
  page,
}) => {
  await page.goto("/");
  const codeWindow = page.locator(".code-window");

  await expect(codeWindow.getByText("App.tsx")).toBeVisible();
  await expect(codeWindow.locator(".code-keyword")).toHaveText("const");
  await expect(codeWindow.locator(".code-component").first()).toHaveText(
    "<DateTimeRangePicker",
  );
  await expect(codeWindow.locator(".code-string")).toHaveText('"UTC"');
});

test("feature examples expose text-only and calendar-only modes", async ({
  page,
}) => {
  await page.goto("/");

  const textScenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Text-only toolbar" });
  await textScenario.getByRole("button", { name: "Open calendar" }).click();
  const textDialog = textScenario.getByRole("dialog", {
    name: "Enter exact range",
  });
  await expect(textDialog.getByRole("grid")).toHaveCount(0);
  await textDialog.getByTestId("dtrp-cancel").click();

  const calendarScenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Calendar-only selection" });
  await calendarScenario.getByRole("button", { name: "Open calendar" }).click();
  const calendarDialog = calendarScenario.getByRole("dialog", {
    name: "Choose reporting days",
  });
  await expect(calendarDialog.getByRole("grid").first()).toBeVisible();
  await expect(calendarScenario.getByRole("textbox")).toHaveCount(2);
});

test("constrained preset produces a complete draft", async ({ page }) => {
  await page.goto("/");
  await page.clock.setFixedTime(new Date("2026-08-09T00:00:00.000Z"));
  const scenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Guardrailed reporting window" });
  await scenario.getByRole("button", { name: "Open calendar" }).click();
  const dialog = page.getByRole("dialog", { name: "Constrained range" });
  await dialog.getByTestId("dtrp-preset-today").click();
  await expect(scenario.getByTestId("dtrp-start-input")).not.toHaveValue("");
  await expect(scenario.getByTestId("dtrp-end-input")).not.toHaveValue("");
  await expect(dialog.getByTestId("dtrp-next")).toBeEnabled();
});

test("playground reports required validation and invalid case explains failure", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Clear draft timestamps" }).click();
  await page.getByLabel("Required").check();
  await page.getByTestId("dtrp-trigger").first().click();
  await expect(page.getByTestId("dtrp-validation").first()).toContainText(
    "請選擇日期與時間範圍。",
  );
  await page.getByTestId("dtrp-cancel").first().click();

  const invalidScenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Invalid controlled range" });
  await invalidScenario.getByRole("button", { name: "Open calendar" }).click();
  await expect(page.getByText("End must be after start.")).toBeVisible();
});

test("DST examples expose gap and overlap guidance", async ({ page }) => {
  await page.goto("/");

  const gapScenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Spring-forward gap" });
  await gapScenario.getByRole("button", { name: "Open calendar" }).click();
  let dialog = page.getByRole("dialog", { name: "DST gap example" });
  await gapScenario.getByTestId("dtrp-start-input").fill("2024/03/10 02:30:00");
  await gapScenario.getByTestId("dtrp-start-input").blur();
  await expect(dialog).toContainText("This local time does not exist.");
  await dialog.getByTestId("dtrp-cancel").click();

  const overlapScenario = page
    .locator(".scenario-card")
    .filter({ hasText: "Fall-back overlap" });
  await overlapScenario.getByRole("button", { name: "Open calendar" }).click();
  dialog = page.getByRole("dialog", { name: "DST overlap example" });
  await overlapScenario
    .getByTestId("dtrp-start-input")
    .fill("2024/11/03 01:30:00");
  await overlapScenario.getByTestId("dtrp-start-input").blur();
  await expect(
    dialog.getByRole("combobox", { name: "Start UTC offset" }),
  ).toBeVisible();
});
