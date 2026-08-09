import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { DateTimeRangePicker } from "../src/index.js";
import type { DateTimeRangeValue } from "../src/index.js";

const AUGUST_RANGE: DateTimeRangeValue = {
  startTimestamp: Date.UTC(2026, 7, 1),
  endTimestamp: Date.UTC(2026, 7, 20),
};

async function renderOpenCalendar(
  value: DateTimeRangeValue = AUGUST_RANGE,
  extraProps: Partial<React.ComponentProps<typeof DateTimeRangePicker>> = {},
): Promise<void> {
  const user = userEvent.setup();
  render(
    <DateTimeRangePicker
      value={value}
      onChange={vi.fn()}
      onCommit={vi.fn()}
      {...extraProps}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open calendar" }));
}

describe("calendar", () => {
  test("always renders exactly one month", async () => {
    await renderOpenCalendar();

    expect(screen.getAllByRole("grid")).toHaveLength(1);
    expect(screen.getByRole("grid", { name: "August 2026" })).not.toBeNull();
    expect(screen.queryByRole("grid", { name: "September 2026" })).toBeNull();
  });

  test("renders a complete six-week month grid with locale weekdays", async () => {
    await renderOpenCalendar();
    const grid = screen.getByRole("grid", { name: "August 2026" });

    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });

  test("locale controls the first weekday", async () => {
    await renderOpenCalendar(AUGUST_RANGE, { locale: "en-GB" });
    const grid = screen.getByRole("grid", { name: "August 2026" });
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  test("month navigation crosses year boundaries without adding a second grid", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar({
      startTimestamp: Date.UTC(2026, 11, 1),
      endTimestamp: Date.UTC(2026, 11, 20),
    });

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "January 2027" })).not.toBeNull();
    expect(screen.getAllByRole("grid")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("grid", { name: "December 2026" })).not.toBeNull();
  });

  test("month navigation uses localized accessible labels", async () => {
    await renderOpenCalendar(AUGUST_RANGE, {
      localeText: {
        previousMonthLabel: "Previous billing month",
        nextMonthLabel: "Next billing month",
      },
    });

    expect(
      screen.getByRole("button", { name: "Previous billing month" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Next billing month" }),
    ).not.toBeNull();
  });

  test("year and month controls jump directly to a distant month", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar({
      startTimestamp: Date.UTC(2026, 7, 1),
      endTimestamp: null,
    });

    await user.click(screen.getByRole("button", { name: "Choose year: 2026" }));
    const yearGrid = screen.getByRole("grid", { name: "Choose year" });
    await user.click(within(yearGrid).getByRole("gridcell", { name: "2030" }));

    const monthGrid = screen.getByRole("grid", { name: "Choose month" });
    await user.click(
      within(monthGrid).getByRole("gridcell", { name: "March" }),
    );

    expect(screen.getByRole("grid", { name: "March 2030" })).not.toBeNull();
    expect(screen.getAllByRole("grid")).toHaveLength(1);
  });

  test("year and month controls can return without selecting", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar();
    const yearButton = screen.getByRole("button", {
      name: "Choose year: 2026",
    });
    const monthButton = screen.getByRole("button", {
      name: "Choose month: August",
    });

    await user.click(yearButton);
    expect(screen.getByRole("grid", { name: "Choose year" })).not.toBeNull();
    await user.click(yearButton);
    expect(screen.getByRole("grid", { name: "August 2026" })).not.toBeNull();

    await user.click(monthButton);
    expect(screen.getByRole("grid", { name: "Choose month" })).not.toBeNull();
    await user.click(monthButton);
    expect(screen.getByRole("grid", { name: "August 2026" })).not.toBeNull();
  });

  test("month view disables months outside target constraints", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar(AUGUST_RANGE, {
      constraints: {
        minTimestamp: Date.UTC(2026, 5, 1),
        maxTimestamp: Date.UTC(2026, 8, 30),
        maxDurationMilliseconds: null,
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Choose month: August" }),
    );
    const monthGrid = screen.getByRole("grid", { name: "Choose month" });

    expect(
      within(monthGrid)
        .getByRole("gridcell", { name: "May" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      within(monthGrid)
        .getByRole("gridcell", { name: "June" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  test("start selection changes only Start and preserves End", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    await renderOpenCalendar(AUGUST_RANGE, { onChange });

    await user.click(
      screen.getByRole("gridcell", { name: "Monday, August 10, 2026" }),
    );

    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 10),
      endTimestamp: Date.UTC(2026, 7, 20),
    });
  });

  test("end selection changes only End and preserves Start", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={AUGUST_RANGE}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("textbox", { name: "End" }));
    expect(screen.getByRole("dialog").getAttribute("data-target")).toBe("end");
    await user.click(
      screen.getByRole("gridcell", { name: "Wednesday, August 12, 2026" }),
    );

    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 1),
      endTimestamp: Date.UTC(2026, 7, 12),
    });
  });

  test("End keeps the Start marker and extends range color through the selected End", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: Date.UTC(2026, 7, 10), endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("textbox", { name: "End" }));
    const start = screen.getByRole("gridcell", {
      name: "Monday, August 10, 2026",
    });
    expect(start.getAttribute("aria-selected")).toBe("true");
    expect(start.getAttribute("data-range-start")).toBe("true");
    expect(start.getAttribute("data-range-complete")).toBe("false");

    await user.click(
      screen.getByRole("gridcell", { name: "Wednesday, August 12, 2026" }),
    );
    expect(
      screen
        .getByRole("gridcell", { name: "Tuesday, August 11, 2026" })
        .getAttribute("data-in-range"),
    ).toBe("true");
    expect(
      screen
        .getByRole("gridcell", { name: "Wednesday, August 12, 2026" })
        .getAttribute("data-range-end"),
    ).toBe("true");
    expect(start.getAttribute("data-range-complete")).toBe("true");
  });

  test("target-specific constraints disable invalid dates", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: Date.UTC(2026, 7, 10), endTimestamp: null }}
        constraints={{
          minTimestamp: null,
          maxTimestamp: null,
          maxDurationMilliseconds: 2 * 86_400_000,
        }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("textbox", { name: "End" }));

    expect(
      screen
        .getByRole("gridcell", { name: "Sunday, August 9, 2026" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("gridcell", { name: "Wednesday, August 12, 2026" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(
      screen
        .getByRole("gridcell", { name: "Thursday, August 13, 2026" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  test("keyboard navigation moves focus and replaces the visible month", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar();
    const first = screen.getByRole("gridcell", {
      name: "Saturday, August 1, 2026",
    });
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Sunday, August 2, 2026",
    );
    await user.keyboard("{PageDown}");
    expect(screen.getByRole("grid", { name: "September 2026" })).not.toBeNull();
    expect(screen.getAllByRole("grid")).toHaveLength(1);
  });
});
