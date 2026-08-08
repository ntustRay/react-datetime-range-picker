import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { DateTimeRangePicker } from "../src/index.js";
import type { DateTimeRangeValue } from "../src/index.js";

const AUGUST_RANGE = {
  startTimestamp: Date.UTC(2026, 7, 1),
  endTimestamp: Date.UTC(2026, 7, 2),
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
  await user.click(
    screen.getByRole("button", { name: "Select date and time range" }),
  );
}

describe("calendar", () => {
  test("renders a complete six-week month grid with locale weekdays", async () => {
    await renderOpenCalendar();
    const grid = screen.getByRole("grid", { name: "August 2026" });

    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
    expect(
      within(grid).getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(
      within(grid).getByRole("gridcell", {
        name: "Sunday, July 26, 2026",
      }),
    ).not.toBeNull();
  });

  test("locale and explicit weekday override control grid order", async () => {
    await renderOpenCalendar(AUGUST_RANGE, { locale: "en-GB" });
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  test("month navigation crosses year boundaries", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar({
      startTimestamp: Date.UTC(2026, 11, 1),
      endTimestamp: Date.UTC(2026, 11, 2),
    });

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "January 2027" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("grid", { name: "December 2026" })).not.toBeNull();
  });

  test("leap-year February includes February 29", async () => {
    await renderOpenCalendar({
      startTimestamp: Date.UTC(2024, 1, 1),
      endTimestamp: Date.UTC(2024, 1, 2),
    });

    expect(
      screen.getByRole("gridcell", { name: "Thursday, February 29, 2024" }),
    ).not.toBeNull();
  });

  test("non-leap February has no February 29", async () => {
    await renderOpenCalendar({
      startTimestamp: Date.UTC(2026, 1, 1),
      endTimestamp: Date.UTC(2026, 1, 2),
    });
    expect(
      screen.queryByRole("gridcell", { name: "Sunday, February 29, 2026" }),
    ).toBeNull();
  });

  test.each([
    [2026, 2, "Sunday"],
    [2026, 6, "Monday"],
    [2026, 9, "Tuesday"],
    [2026, 4, "Wednesday"],
    [2026, 1, "Thursday"],
    [2026, 5, "Friday"],
    [2026, 8, "Saturday"],
  ] as const)(
    "renders a month beginning on %s-%s",
    async (year, month, weekday) => {
      await renderOpenCalendar({
        startTimestamp: Date.UTC(year, month - 1, 1),
        endTimestamp: Date.UTC(year, month - 1, 2),
      });
      const monthName = new Intl.DateTimeFormat("en", {
        month: "long",
        timeZone: "UTC",
      }).format(Date.UTC(year, month - 1, 1));
      expect(
        screen.getByRole("gridcell", {
          name: `${weekday}, ${monthName} 1, ${year}`,
        }),
      ).not.toBeNull();
    },
  );

  test("pointer selection emits a start draft and then a complete range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    await renderOpenCalendar(AUGUST_RANGE, { onChange });

    await user.click(
      screen.getByRole("gridcell", { name: "Monday, August 10, 2026" }),
    );
    await user.click(
      screen.getByRole("gridcell", { name: "Wednesday, August 12, 2026" }),
    );

    expect(onChange).toHaveBeenNthCalledWith(1, {
      startTimestamp: Date.UTC(2026, 7, 10),
      endTimestamp: null,
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      startTimestamp: Date.UTC(2026, 7, 10),
      endTimestamp: Date.UTC(2026, 7, 12),
    });
  });

  test("constraints disable unavailable start and end dates", async () => {
    await renderOpenCalendar(
      { startTimestamp: Date.UTC(2026, 7, 10), endTimestamp: null },
      {
        constraints: {
          minTimestamp: Date.UTC(2026, 7, 5),
          maxTimestamp: Date.UTC(2026, 7, 20),
          maxDurationMilliseconds: 2 * 86_400_000,
        },
      },
    );

    expect(
      screen
        .getByRole("gridcell", { name: "Tuesday, August 4, 2026" })
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

  test("half-open visual range excludes the selected endpoints", async () => {
    await renderOpenCalendar({
      startTimestamp: Date.UTC(2026, 7, 10),
      endTimestamp: Date.UTC(2026, 7, 13),
    });

    expect(
      screen
        .getByRole("gridcell", { name: "Tuesday, August 11, 2026" })
        .getAttribute("data-in-range"),
    ).toBe("true");
    expect(
      screen
        .getByRole("gridcell", { name: "Monday, August 10, 2026" })
        .getAttribute("data-in-range"),
    ).toBe("false");
    expect(
      screen
        .getByRole("gridcell", { name: "Thursday, August 13, 2026" })
        .getAttribute("data-in-range"),
    ).toBe("false");
  });

  test("arrow, Home, End, and Page Down keys move calendar focus", async () => {
    const user = userEvent.setup();
    await renderOpenCalendar();
    const augustFirst = screen.getByRole("gridcell", {
      name: "Saturday, August 1, 2026",
    });
    augustFirst.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Sunday, August 2, 2026",
    );
    await user.keyboard("{Home}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Sunday, August 2, 2026",
    );
    await user.keyboard("{End}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Saturday, August 8, 2026",
    );
    await user.keyboard("{PageDown}");
    expect(screen.getByRole("grid", { name: "September 2026" })).not.toBeNull();
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Saturday, September 12, 2026",
    );
  });
});
