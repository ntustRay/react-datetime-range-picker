import { describe, expect, test } from "vitest";

import {
  createDateTimeRangeDraft,
  transitionDateTimeRangeDraft,
  validateDateTimeRangeDraft,
  type DateTimeRangeDraftContext,
} from "../src/internal/date-time-range-draft.js";

const UTC_CONTEXT: DateTimeRangeDraftContext = {
  timezone: "UTC",
  precision: "second",
  hourCycle: "h24",
};

describe("date-time range draft", () => {
  test("creates editable fields from the controlled value", () => {
    const state = createDateTimeRangeDraft(
      {
        startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
        endTimestamp: Date.UTC(2026, 7, 9, 13, 34, 56),
      },
      UTC_CONTEXT,
    );

    expect(state.start).toMatchObject({
      text: "2026/08/09 12:34:56",
      error: null,
    });
    expect(state.end).toMatchObject({
      text: "2026/08/09 13:34:56",
      error: null,
    });
  });

  test("keeps incomplete text local until commit produces a value", () => {
    const initial = createDateTimeRangeDraft(
      { startTimestamp: null, endTimestamp: null },
      UTC_CONTEXT,
    );
    const edited = transitionDateTimeRangeDraft(
      initial,
      { type: "change-text", target: "start", text: "2026/08/09 12:34:56" },
      UTC_CONTEXT,
    );

    expect(edited.changedValue).toBeNull();
    expect(edited.state.start.error).toBe("invalid-text");

    const committed = transitionDateTimeRangeDraft(
      edited.state,
      { type: "commit-text", target: "start" },
      UTC_CONTEXT,
    );
    expect(committed.changedValue).toEqual({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
      endTimestamp: null,
    });
    expect(committed.state.start.error).toBeNull();
  });

  test("reports malformed text without changing the represented value", () => {
    const initial = createDateTimeRangeDraft(
      { startTimestamp: null, endTimestamp: null },
      UTC_CONTEXT,
    );
    const edited = transitionDateTimeRangeDraft(
      initial,
      { type: "change-text", target: "start", text: "2026/08/" },
      UTC_CONTEXT,
    );
    const committed = transitionDateTimeRangeDraft(
      edited.state,
      { type: "commit-text", target: "start" },
      UTC_CONTEXT,
    );

    expect(committed.changedValue).toBeNull();
    expect(committed.state.value).toEqual(initial.value);
    expect(committed.state.start.error).toBe("invalid-text");
  });

  test("exposes ambiguous offsets and applies the chosen candidate", () => {
    const context: DateTimeRangeDraftContext = {
      timezone: "America/New_York",
      precision: "second",
      hourCycle: "h24",
    };
    const initial = createDateTimeRangeDraft(
      { startTimestamp: null, endTimestamp: null },
      context,
    );
    const edited = transitionDateTimeRangeDraft(
      initial,
      { type: "change-text", target: "start", text: "2024/11/03 01:30:00" },
      context,
    );
    const committed = transitionDateTimeRangeDraft(
      edited.state,
      { type: "commit-text", target: "start" },
      context,
    );

    expect(committed.state.start.error).toBe("ambiguous-local-time");
    expect(committed.state.start.ambiguousCandidates).toHaveLength(2);

    const chosen = transitionDateTimeRangeDraft(
      committed.state,
      { type: "choose-offset", target: "start", index: 1 },
      context,
    );
    expect(chosen.changedValue).toEqual({
      startTimestamp: Date.UTC(2024, 10, 3, 6, 30),
      endTimestamp: null,
    });
    expect(chosen.state.start.error).toBeNull();
    expect(chosen.state.start.ambiguousCandidates).toHaveLength(0);
  });

  test("replacing a value clears stale text errors and candidates", () => {
    const initial = createDateTimeRangeDraft(
      { startTimestamp: null, endTimestamp: null },
      UTC_CONTEXT,
    );
    const edited = transitionDateTimeRangeDraft(
      initial,
      { type: "change-text", target: "start", text: "bad input" },
      UTC_CONTEXT,
    );
    const value = {
      startTimestamp: Date.UTC(2026, 7, 9, 12),
      endTimestamp: Date.UTC(2026, 7, 9, 13),
    };
    const replaced = transitionDateTimeRangeDraft(
      edited.state,
      { type: "replace-value", value },
      UTC_CONTEXT,
    );

    expect(replaced.state.start.error).toBeNull();
    expect(replaced.state.start.text).toBe("2026/08/09 12:00:00");
    expect(replaced.changedValue).toEqual(value);
  });

  test("changes only the target date while preserving its time and the other endpoint", () => {
    const initial = createDateTimeRangeDraft(
      {
        startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
        endTimestamp: Date.UTC(2026, 7, 12, 18),
      },
      UTC_CONTEXT,
    );
    const changed = transitionDateTimeRangeDraft(
      initial,
      {
        type: "change-date",
        target: "start",
        timestamp: Date.UTC(2026, 7, 10),
      },
      UTC_CONTEXT,
    );

    expect(changed.changedValue).toEqual({
      startTimestamp: Date.UTC(2026, 7, 10, 12, 34, 56),
      endTimestamp: Date.UTC(2026, 7, 12, 18),
    });
  });

  test("changes one local time unit without rewriting the date or endpoint", () => {
    const initial = createDateTimeRangeDraft(
      {
        startTimestamp: Date.UTC(2026, 7, 9, 12, 34, 56),
        endTimestamp: Date.UTC(2026, 7, 12, 18),
      },
      UTC_CONTEXT,
    );
    const changed = transitionDateTimeRangeDraft(
      initial,
      {
        type: "change-time-unit",
        target: "start",
        unit: "minute",
        value: 45,
      },
      UTC_CONTEXT,
    );

    expect(changed.changedValue).toEqual({
      startTimestamp: Date.UTC(2026, 7, 9, 12, 45, 56),
      endTimestamp: Date.UTC(2026, 7, 12, 18),
    });
  });

  test("changes AM or PM without changing the displayed twelve-hour value", () => {
    const context: DateTimeRangeDraftContext = {
      timezone: "UTC",
      precision: "second",
      hourCycle: "h12",
    };
    const initial = createDateTimeRangeDraft(
      {
        startTimestamp: Date.UTC(2026, 7, 9, 8, 30),
        endTimestamp: null,
      },
      context,
    );
    const changed = transitionDateTimeRangeDraft(
      initial,
      { type: "change-period", target: "start", period: "pm" },
      context,
    );

    expect(changed.changedValue).toEqual({
      startTimestamp: Date.UTC(2026, 7, 9, 20, 30),
      endTimestamp: null,
    });
    expect(changed.state.start.text).toBe("2026/08/09 08:30:00 PM");
  });

  test("combines field parsing errors with range validation", () => {
    const initial = createDateTimeRangeDraft(
      { startTimestamp: null, endTimestamp: null },
      UTC_CONTEXT,
    );
    const edited = transitionDateTimeRangeDraft(
      initial,
      { type: "change-text", target: "start", text: "bad input" },
      UTC_CONTEXT,
    );

    expect(
      validateDateTimeRangeDraft(edited.state, {
        constraints: {
          minTimestamp: null,
          maxTimestamp: null,
          maxDurationMilliseconds: null,
        },
        steps: { minute: 1, second: 1, millisecond: 1 },
        required: true,
        timezone: "UTC",
      }),
    ).toEqual({
      status: "invalid",
      errors: [
        { code: "required", target: "range" },
        { code: "invalid-text", target: "start" },
      ],
    });
  });
});
