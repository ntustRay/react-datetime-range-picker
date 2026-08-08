import { describe, expect, test } from "vitest";

import { normalizeTimestamp } from "../src/index.js";

describe("normalizeTimestamp", () => {
  test("second precision clears milliseconds in UTC", () => {
    const timestamp = Date.UTC(2026, 7, 9, 12, 34, 56, 789);

    expect(
      normalizeTimestamp(timestamp, {
        precision: "second",
        timezone: "UTC",
      }),
    ).toBe(Date.UTC(2026, 7, 9, 12, 34, 56, 0));
  });

  test.each([
    ["year", Date.UTC(2026, 0, 1, 0, 0, 0, 0)],
    ["month", Date.UTC(2026, 7, 1, 0, 0, 0, 0)],
    ["day", Date.UTC(2026, 7, 9, 0, 0, 0, 0)],
    ["hour", Date.UTC(2026, 7, 9, 12, 0, 0, 0)],
    ["minute", Date.UTC(2026, 7, 9, 12, 34, 0, 0)],
    ["second", Date.UTC(2026, 7, 9, 12, 34, 56, 0)],
    ["millisecond", Date.UTC(2026, 7, 9, 12, 34, 56, 789)],
  ] as const)("%s precision clears only lower UTC units", (precision, expected) => {
    const timestamp = Date.UTC(2026, 7, 9, 12, 34, 56, 789);

    expect(normalizeTimestamp(timestamp, { precision, timezone: "UTC" })).toBe(
      expected,
    );
  });

  test("normalizes leap-day and month-end timestamps without rollover", () => {
    expect(
      normalizeTimestamp(Date.UTC(2024, 1, 29, 23, 59, 59, 999), {
        precision: "month",
        timezone: "UTC",
      }),
    ).toBe(Date.UTC(2024, 1, 1, 0, 0, 0, 0));
    expect(
      normalizeTimestamp(Date.UTC(2026, 4, 31, 23, 59, 59, 999), {
        precision: "year",
        timezone: "UTC",
      }),
    ).toBe(Date.UTC(2026, 0, 1, 0, 0, 0, 0));
  });

  test("normalizes timestamps before the Unix epoch", () => {
    expect(
      normalizeTimestamp(Date.UTC(1969, 11, 31, 23, 59, 59, 999), {
        precision: "day",
        timezone: "UTC",
      }),
    ).toBe(Date.UTC(1969, 11, 31, 0, 0, 0, 0));
  });

  test("normalizes timestamps beyond the year 2038", () => {
    expect(
      normalizeTimestamp(Date.UTC(2042, 5, 15, 8, 9, 10, 111), {
        precision: "hour",
        timezone: "UTC",
      }),
    ).toBe(Date.UTC(2042, 5, 15, 8, 0, 0, 0));
  });
});
