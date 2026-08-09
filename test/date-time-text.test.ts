import { describe, expect, test } from "vitest";

import {
  formatEditableTimestamp,
  getEditableDateTimeFormat,
  parseEditableDateTime,
} from "../src/internal/date-time-text.js";

describe("editable date-time text", () => {
  test("formats and parses slash-separated 24-hour text", () => {
    const timestamp = Date.UTC(2026, 7, 9, 20, 5, 6);

    expect(getEditableDateTimeFormat("second", "h24")).toBe(
      "YYYY/MM/DD HH:mm:ss",
    );
    expect(formatEditableTimestamp(timestamp, "UTC", "second", "h24")).toBe(
      "2026/08/09 20:05:06",
    );
    expect(
      parseEditableDateTime("2026/08/09 20:05:06", "UTC", "second", "h24"),
    ).toMatchObject({
      status: "valid",
      candidates: [{ timestamp }],
    });
  });

  test("formats and parses 12-hour text without changing the instant", () => {
    const midnight = Date.UTC(2026, 7, 9, 0, 5, 6);
    const afternoon = Date.UTC(2026, 7, 9, 20, 5, 6);

    expect(getEditableDateTimeFormat("second", "h12")).toBe(
      "YYYY/MM/DD hh:mm:ss AM",
    );
    expect(formatEditableTimestamp(midnight, "UTC", "second", "h12")).toBe(
      "2026/08/09 12:05:06 AM",
    );
    expect(
      formatEditableTimestamp(afternoon, "UTC", "second", "h12"),
    ).toBe("2026/08/09 08:05:06 PM");
    expect(
      parseEditableDateTime(
        "2026/08/09 08:05:06 PM",
        "UTC",
        "second",
        "h12",
      ),
    ).toMatchObject({
      status: "valid",
      candidates: [{ timestamp: afternoon }],
    });
  });

  test("rejects invalid 12-hour values and legacy dash dates", () => {
    expect(
      parseEditableDateTime("2026/08/09 00:00:00 AM", "UTC", "second", "h12")
        .status,
    ).toBe("invalid");
    expect(
      parseEditableDateTime("2026-08-09 20:00:00", "UTC", "second", "h24")
        .status,
    ).toBe("invalid");
  });
});
