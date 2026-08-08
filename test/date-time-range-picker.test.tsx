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
});
