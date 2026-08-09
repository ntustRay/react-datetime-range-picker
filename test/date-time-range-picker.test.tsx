import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { DateTimeRangePicker } from "../src/index.js";

describe("DateTimeRangePicker", () => {
  test("opens an accessible date-time range dialog", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select date and time range" }));

    expect(
      screen.getByRole("dialog", { name: "Select date and time range" }).hidden,
    ).toBe(false);
  });

  test("preset edits stay draft until Apply commits them", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const presetValue = { startTimestamp: 1_000, endTimestamp: 2_000 };
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        presets={[{ id: "known", label: "Known range", getValue: () => presetValue }]}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    await user.click(screen.getByRole("button", { name: "Known range" }));

    expect(onChange).toHaveBeenCalledWith(presetValue);
    expect(onCommit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onCommit).toHaveBeenCalledWith(presetValue);
  });

  test.each([
    { startTimestamp: 1_000, endTimestamp: null },
    { startTimestamp: 2_000, endTimestamp: 1_000 },
  ])("incomplete or invalid drafts cannot commit", async (presetValue) => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        presets={[{ id: "invalid", label: "Invalid range", getValue: () => presetValue }]}
        onChange={vi.fn()}
        onCommit={onCommit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    await user.click(screen.getByRole("button", { name: "Invalid range" }));

    expect(screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
  });

  test("Cancel discards draft edits", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        presets={[
          {
            id: "known",
            label: "Known range",
            getValue: () => ({ startTimestamp: 1_000, endTimestamp: 2_000 }),
          },
        ]}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    await user.click(screen.getByRole("button", { name: "Known range" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));

    expect(screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")).toBe(true);
  });

  test("Escape cancels and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Select date and time range" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("a pointer interaction outside cancels the open draft", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("Clear emits two explicit null fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: 1_000, endTimestamp: 2_000 }}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(onChange).toHaveBeenCalledWith({
      startTimestamp: null,
      endTimestamp: null,
    });
  });

  test("controlled updates replace an open draft", async () => {
    const user = userEvent.setup();
    const baseProps = { onChange: vi.fn(), onCommit: vi.fn() };
    const { rerender } = render(
      <DateTimeRangePicker
        {...baseProps}
        value={{ startTimestamp: null, endTimestamp: null }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    expect(screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")).toBe(true);

    rerender(
      <DateTimeRangePicker
        {...baseProps}
        value={{ startTimestamp: 1_000, endTimestamp: 2_000 }}
      />,
    );

    expect(screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")).toBe(false);
  });

  test("rapid controlled updates keep the latest complete range", async () => {
    const user = userEvent.setup();
    const baseProps = { onChange: vi.fn(), onCommit: vi.fn() };
    const { rerender } = render(
      <DateTimeRangePicker
        {...baseProps}
        value={{ startTimestamp: null, endTimestamp: null }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));

    rerender(
      <DateTimeRangePicker
        {...baseProps}
        value={{ startTimestamp: 1_000, endTimestamp: null }}
      />,
    );
    rerender(
      <DateTimeRangePicker
        {...baseProps}
        value={{ startTimestamp: 2_000, endTimestamp: 3_000 }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(baseProps.onCommit).toHaveBeenCalledWith({
      startTimestamp: 2_000,
      endTimestamp: 3_000,
    });
  });

  test.each([{ disabled: true }, { readOnly: true }])(
    "disabled and read-only pickers do not open",
    async (mode) => {
      const user = userEvent.setup();
      render(
        <DateTimeRangePicker
          {...mode}
          value={{ startTimestamp: null, endTimestamp: null }}
          onChange={vi.fn()}
          onCommit={vi.fn()}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Select date and time range" }));
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );

  test("validation notifications emit only when the result changes", async () => {
    const user = userEvent.setup();
    const onValidationChange = vi.fn();
    const props = {
      value: { startTimestamp: null, endTimestamp: null },
      onChange: vi.fn(),
      onCommit: vi.fn(),
      onValidationChange,
    };
    const { rerender } = render(<DateTimeRangePicker {...props} />);
    expect(onValidationChange).toHaveBeenCalledTimes(1);

    rerender(<DateTimeRangePicker {...props} />);
    expect(onValidationChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    expect(onValidationChange).toHaveBeenCalledTimes(1);
  });

  test("valid text edits emit normalized epoch-millisecond drafts", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));

    const start = screen.getByRole("textbox", { name: "Start" });
    const end = screen.getByRole("textbox", { name: "End" });
    await user.type(start, "2026-08-09 12:34:56");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
      endTimestamp: null,
    });

    await user.type(end, "2026-08-09 13:34:56");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
      endTimestamp: Date.UTC(2026, 7, 9, 13, 34, 56),
    });
  });

  test("temporarily incomplete and malformed text remains visible", async () => {
    const user = userEvent.setup();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    const start = screen.getByRole("textbox", { name: "Start" });

    await user.type(start, "2026-08-");
    expect(start.getAttribute("value")).toBe("2026-08-");
    expect(start.getAttribute("aria-invalid")).toBe("true");
    await user.tab();
    expect(start.getAttribute("value")).toBe("2026-08-");
    expect(screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Enter a valid date and time.").id).toBe(
      "dtrp-start-invalid-text-error",
    );
    expect(start.getAttribute("aria-describedby")).toContain(
      "dtrp-start-invalid-text-error",
    );
  });

  test("pasted date-time text parses at the blur boundary", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    const start = screen.getByRole("textbox", { name: "Start" });
    await user.click(start);
    await user.paste("2026-08-09 12:34:56");
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
      endTimestamp: null,
    });
  });

  test("precision controls the editable format and lower-unit normalization", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeRangePicker
        precision="minute"
        value={{ startTimestamp: null, endTimestamp: null }}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    const start = screen.getByRole("textbox", { name: "Start" });

    await user.type(start, "2026-08-09 12:34");
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 0, 0),
      endTimestamp: null,
    });
    expect(screen.getAllByText("YYYY-MM-DD HH:mm")).toHaveLength(2);
  });

  test.each([
    ["hour", true, "time"],
    ["minute", true, "time"],
    ["second", true, "time"],
    ["millisecond", true, "text"],
  ] as const)(
    "precision %s renders the corresponding time controls",
    async (precision, visible, inputType) => {
      const user = userEvent.setup();
      render(
        <DateTimeRangePicker
          precision={precision}
          value={{
            startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56, 789),
            endTimestamp: Date.UTC(2026, 7, 9, 13, 34, 56, 789),
          }}
          onChange={vi.fn()}
          onCommit={vi.fn()}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Select date and time range" }));
      const startTime = screen.queryByTestId("dtrp-start-time");
      expect(startTime !== null).toBe(visible);
      if (startTime !== null) expect(startTime.getAttribute("type")).toBe(inputType);
    },
  );

  test.each([
    ["2024-03-10 02:30:00", "nonexistent-local-time"],
    ["2024-11-03 01:30:00", "ambiguous-local-time"],
  ] as const)("DST-invalid text reports %s", async (text, errorCode) => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole("button", { name: "Select date and time range" }));
    const start = screen.getByRole("textbox", { name: "Start" });
    await user.type(start, text);
    await user.tab();

    expect(onValidationChange).toHaveBeenLastCalledWith({
      status: "invalid",
      errors: [{ code: errorCode, target: "start" }],
    });
  });

  test("the closed summary uses the selected locale and display timezone", () => {
    render(
      <DateTimeRangePicker
        locale="zh-TW"
        timezone="Asia/Taipei"
        value={{
          startTimestamp: Date.UTC(2026, 7, 9, 12, 0, 0),
          endTimestamp: Date.UTC(2026, 7, 9, 13, 0, 0),
        }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Select date and time range" })
        .textContent?.replaceAll(/\s/gu, " "),
    ).toBe("2026/08/09 20:00:00 – 2026/08/09 21:00:00");
  });
});
