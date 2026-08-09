import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { DateTimeRangePicker } from "../src/index.js";
import type { DateTimeRangeValue, HourCycle } from "../src/index.js";

const COMPLETE_RANGE: DateTimeRangeValue = {
  startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
  endTimestamp: Date.UTC(2026, 7, 9, 13, 34, 56),
};

afterEach(() => vi.useRealTimers());

describe("DateTimeRangePicker", () => {
  test("defaults to light and supports an explicit dark color scheme", () => {
    const props = {
      value: COMPLETE_RANGE,
      onChange: vi.fn(),
      onCommit: vi.fn(),
    };
    const { rerender } = render(<DateTimeRangePicker {...props} />);
    expect(
      screen.getByTestId("dtrp-root").getAttribute("data-color-scheme"),
    ).toBe("light");

    rerender(<DateTimeRangePicker {...props} colorScheme="dark" />);
    expect(
      screen.getByTestId("dtrp-root").getAttribute("data-color-scheme"),
    ).toBe("dark");
  });

  test("defaults to a floating popover and supports inline presentation", async () => {
    const user = userEvent.setup();
    const props = {
      value: COMPLETE_RANGE,
      onChange: vi.fn(),
      onCommit: vi.fn(),
    };
    const { rerender } = render(<DateTimeRangePicker {...props} />);

    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(screen.getByRole("dialog").getAttribute("data-popover-mode")).toBe(
      "floating",
    );

    rerender(<DateTimeRangePicker {...props} popoverMode="inline" />);
    expect(screen.getByRole("dialog").getAttribute("data-popover-mode")).toBe(
      "inline",
    );
  });

  test("renders two text inputs and disables End until Start is valid", () => {
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("textbox", { name: "Start" })
        .getAttribute("placeholder"),
    ).toBe("YYYY/MM/DD HH:mm:ss");
    expect(
      screen.getByRole("textbox", { name: "End" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Open calendar" }),
    ).not.toBeNull();
  });

  test("locale overrides use defaults for omitted wording", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        localeText={{
          calendarButtonLabel: "開啟日期",
          nextButtonLabel: "下一步",
        }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "開啟日期" }));
    expect(screen.getByRole("button", { name: "下一步" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeNull();
  });

  test("focus chooses one active target and the icon remembers it", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("textbox", { name: "End" }));
    expect(screen.getByRole("dialog").getAttribute("data-target")).toBe("end");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(screen.getByRole("dialog").getAttribute("data-target")).toBe("end");
  });

  test("text parsing waits for the 300ms debounce", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    const start = screen.getByRole("textbox", { name: "Start" });
    fireEvent.focus(start);
    fireEvent.change(start, { target: { value: "2026/08/09 12:34:56" } });

    act(() => vi.advanceTimersByTime(299));
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
      endTimestamp: null,
    });
  });

  test("blur parses immediately and invalid text stays visible", () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    const start = screen.getByRole("textbox", { name: "Start" });
    fireEvent.focus(start);
    fireEvent.change(start, { target: { value: "2026/08/" } });
    fireEvent.blur(start);

    expect(start.getAttribute("value")).toBe("2026/08/");
    expect(start.getAttribute("aria-invalid")).toBe("true");
    expect(onChange).not.toHaveBeenCalled();
  });

  test("Next keeps the popover open, switches to End, then Apply commits", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        onChange={vi.fn()}
        onCommit={onCommit}
      />,
    );

    await user.click(screen.getByRole("textbox", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog").getAttribute("data-target")).toBe("end");
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onCommit).toHaveBeenCalledWith(COMPLETE_RANGE);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "End" }),
    );
  });

  test("Reset restores the range captured when the popover opened", async () => {
    const user = userEvent.setup();

    function ControlledPicker(): React.JSX.Element {
      const [value, setValue] = useState<DateTimeRangeValue>(COMPLETE_RANGE);
      return (
        <DateTimeRangePicker
          value={value}
          onChange={setValue}
          onCommit={vi.fn()}
          presets={[
            {
              id: "other",
              label: "Other range",
              getValue: () => ({ startTimestamp: 1_000, endTimestamp: 2_000 }),
            },
          ]}
        />
      );
    }

    render(<ControlledPicker />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(screen.getByRole("button", { name: "Other range" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(
      screen.getByRole("textbox", { name: "Start" }).getAttribute("value"),
    ).toBe("2026/08/09 12:34:56");
    expect(screen.getByRole("dialog").getAttribute("data-target")).toBe(
      "start",
    );
  });

  test("Cancel restores opening text, closes, and returns focus", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    const start = screen.getByRole("textbox", { name: "Start" });
    await user.click(start);
    await user.clear(start);
    await user.type(start, "broken");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(start.getAttribute("value")).toBe("2026/08/09 12:34:56");
    expect(document.activeElement).toBe(start);
  });

  test("Escape and outside pointer both discard the session", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("textbox", { name: "Start" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("textbox", { name: "Start" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("hour cycle is controlled and h12 adds the period column", async () => {
    const user = userEvent.setup();
    const onHourCycleChange = vi.fn();
    const { rerender } = render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        hourCycle="h24"
        onHourCycleChange={onHourCycleChange}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.selectOptions(screen.getByTestId("dtrp-hour-cycle"), "h12");
    expect(onHourCycleChange).toHaveBeenCalledWith("h12");

    rerender(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        hourCycle="h12"
        onHourCycleChange={onHourCycleChange}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("dtrp-period-column")).not.toBeNull();
    expect(
      screen.getByRole("textbox", { name: "Start" }).getAttribute("value"),
    ).toBe("2026/08/09 12:34:56 PM");
  });

  test.each([
    ["hour", ["dtrp-hour-column"]],
    ["minute", ["dtrp-hour-column", "dtrp-minute-column"]],
    [
      "second",
      ["dtrp-hour-column", "dtrp-minute-column", "dtrp-second-column"],
    ],
    [
      "millisecond",
      [
        "dtrp-hour-column",
        "dtrp-minute-column",
        "dtrp-second-column",
        "dtrp-millisecond-column",
      ],
    ],
  ] as const)(
    "precision %s renders only its time columns",
    async (precision, testIds) => {
      const user = userEvent.setup();
      render(
        <DateTimeRangePicker
          precision={precision}
          value={COMPLETE_RANGE}
          onChange={vi.fn()}
          onCommit={vi.fn()}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Open calendar" }));
      expect(screen.getAllByRole("listbox")).toHaveLength(testIds.length);
      for (const testId of testIds)
        expect(screen.getByTestId(testId)).not.toBeNull();
    },
  );

  test("time columns support keyboard selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    const hour = screen.getByTestId("dtrp-hour-column");
    hour.focus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 13, 34, 56),
      endTimestamp: COMPLETE_RANGE.endTimestamp,
    });
  });

  test("scrolling a time column snaps to and selects the nearest row", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
    const hour = screen.getByTestId("dtrp-hour-column");
    fireEvent.scroll(hour, { target: { scrollTop: 13 * 36 } });
    act(() => vi.advanceTimersByTime(100));

    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 13, 34, 56),
      endTimestamp: COMPLETE_RANGE.endTimestamp,
    });
  });

  test("timezone selection and custom test IDs remain controlled", async () => {
    const user = userEvent.setup();
    const onTimezoneChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={COMPLETE_RANGE}
        timezoneOptions={["UTC", "Asia/Taipei"]}
        onTimezoneChange={onTimezoneChange}
        testIds={{ trigger: "calendar-control", hourColumn: "hours" }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("calendar-control"));
    await user.selectOptions(
      screen.getByTestId("dtrp-timezone"),
      "Asia/Taipei",
    );
    expect(onTimezoneChange).toHaveBeenCalledWith("Asia/Taipei");
    expect(screen.getByTestId("hours")).not.toBeNull();
  });

  test.each([
    ["2024/03/10 02:30:00", "nonexistent-local-time"],
    ["2024/11/03 01:30:00", "ambiguous-local-time"],
  ] as const)("DST-invalid text reports %s", (text, errorCode) => {
    const onValidationChange = vi.fn();
    render(
      <DateTimeRangePicker
        timezone="America/New_York"
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
        onValidationChange={onValidationChange}
      />,
    );
    const start = screen.getByRole("textbox", { name: "Start" });
    fireEvent.focus(start);
    fireEvent.change(start, { target: { value: text } });
    fireEvent.blur(start);

    expect(onValidationChange).toHaveBeenLastCalledWith({
      status: "invalid",
      errors: [{ code: errorCode, target: "start" }],
    });
  });

  test.each([{ disabled: true }, { readOnly: true }])(
    "disabled and read-only pickers cannot open",
    (mode) => {
      render(
        <DateTimeRangePicker
          {...mode}
          value={{ startTimestamp: null, endTimestamp: null }}
          onChange={vi.fn()}
          onCommit={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );

  test("public hour-cycle domain remains narrow", () => {
    const value: HourCycle = "h24";
    expect(value).toBe("h24");
  });
});
