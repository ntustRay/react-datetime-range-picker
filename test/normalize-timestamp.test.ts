import { describe, expect, test } from "vitest";

import { normalizeTimestamp } from "../src/index.js";

describe("normalizeTimestamp", () => {
  test("defaults to UTC when timezone is omitted", () => {
    expect(
      normalizeTimestamp(Date.UTC(2026, 7, 9, 12, 34, 56, 789), {
        precision: "day",
      }),
    ).toBe(Date.UTC(2026, 7, 9, 0, 0, 0, 0));
  });
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
  ] as const)(
    "%s precision clears only lower UTC units",
    (precision, expected) => {
      const timestamp = Date.UTC(2026, 7, 9, 12, 34, 56, 789);

      expect(
        normalizeTimestamp(timestamp, { precision, timezone: "UTC" }),
      ).toBe(expected);
    },
  );

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

  test("day precision uses the selected IANA timezone", () => {
    const afternoonInTaipei = Date.UTC(2026, 7, 9, 7, 30, 0, 0);

    expect(
      normalizeTimestamp(afternoonInTaipei, {
        precision: "day",
        timezone: "Asia/Taipei",
      }),
    ).toBe(Date.UTC(2026, 7, 8, 16, 0, 0, 0));
  });

  test.each([
    ["America/New_York", Date.UTC(2026, 0, 15, 5, 0, 0, 0)],
    ["Asia/Kathmandu", Date.UTC(2026, 0, 14, 18, 15, 0, 0)],
  ] as const)("day precision supports the %s offset", (timezone, expected) => {
    expect(
      normalizeTimestamp(Date.UTC(2026, 0, 15, 12, 0, 0, 0), {
        precision: "day",
        timezone,
      }),
    ).toBe(expected);
  });

  test("millisecond precision keeps the instant across display timezones", () => {
    const timestamp = Date.UTC(2026, 7, 9, 12, 34, 56, 789);

    expect(
      normalizeTimestamp(timestamp, {
        precision: "millisecond",
        timezone: "America/New_York",
      }),
    ).toBe(timestamp);
  });

  test("rejects an invalid IANA timezone", () => {
    expect(() =>
      normalizeTimestamp(0, {
        precision: "day",
        timezone: "Not/A_Timezone",
      }),
    ).toThrow(RangeError);
  });

  test.each([
    [Date.UTC(2024, 10, 3, 5, 30, 45), Date.UTC(2024, 10, 3, 5, 30, 0)],
    [Date.UTC(2024, 10, 3, 6, 30, 45), Date.UTC(2024, 10, 3, 6, 30, 0)],
  ] as const)(
    "preserves the selected offset in a repeated local time",
    (timestamp, expected) => {
      expect(
        normalizeTimestamp(timestamp, {
          precision: "minute",
          timezone: "America/New_York",
        }),
      ).toBe(expected);
    },
  );

  test.each([
    [Date.UTC(2024, 2, 10, 6, 30), Date.UTC(2024, 2, 10, 6, 0)],
    [Date.UTC(2024, 2, 10, 7, 30), Date.UTC(2024, 2, 10, 7, 0)],
  ] as const)(
    "normalizes valid hours around a daylight-saving gap",
    (timestamp, expected) => {
      expect(
        normalizeTimestamp(timestamp, {
          precision: "hour",
          timezone: "America/New_York",
        }),
      ).toBe(expected);
    },
  );

  test("rejects a normalized local time inside a non-hour DST gap", () => {
    expect(() =>
      normalizeTimestamp(Date.UTC(2024, 9, 5, 15, 45), {
        precision: "hour",
        timezone: "Australia/Lord_Howe",
      }),
    ).toThrow("Normalized local time does not exist.");
  });
});
