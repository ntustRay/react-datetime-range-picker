import { describe, expect, test } from "vitest";

import { validateDateTimeRange } from "../src/index.js";

describe("validateDateTimeRange", () => {
  test("an optional empty range is valid and empty", () => {
    expect(
      validateDateTimeRange({ startTimestamp: null, endTimestamp: null }),
    ).toEqual({ status: "empty", errors: [] });
  });

  test("a start-only value is a valid draft", () => {
    expect(
      validateDateTimeRange({ startTimestamp: 1_000, endTimestamp: null }),
    ).toEqual({ status: "draft", errors: [] });
  });

  test("an end without a start is invalid", () => {
    expect(
      validateDateTimeRange({ startTimestamp: null, endTimestamp: 2_000 }),
    ).toEqual({
      status: "invalid",
      errors: [{ code: "end-without-start", target: "end" }],
    });
  });

  test.each([1_000, 999])(
    "an end at or before the start is invalid",
    (endTimestamp) => {
      expect(
        validateDateTimeRange({ startTimestamp: 1_000, endTimestamp }),
      ).toEqual({
        status: "invalid",
        errors: [{ code: "end-not-after-start", target: "range" }],
      });
    },
  );

  test("a strictly later end forms a complete half-open range", () => {
    expect(
      validateDateTimeRange({ startTimestamp: 1_000, endTimestamp: 1_001 }),
    ).toEqual({ status: "complete", errors: [] });
  });

  test("minimum and maximum constraints apply to both endpoints", () => {
    expect(
      validateDateTimeRange(
        { startTimestamp: 999, endTimestamp: 2_001 },
        {
          constraints: {
            minTimestamp: 1_000,
            maxTimestamp: 2_000,
            maxDurationMilliseconds: null,
          },
        },
      ),
    ).toEqual({
      status: "invalid",
      errors: [
        { code: "before-minimum", target: "start" },
        { code: "after-maximum", target: "end" },
      ],
    });
  });

  test("maximum duration rejects only ranges that exceed the limit", () => {
    const options = {
      constraints: {
        minTimestamp: null,
        maxTimestamp: null,
        maxDurationMilliseconds: 1_000,
      },
    };

    expect(
      validateDateTimeRange(
        { startTimestamp: 1_000, endTimestamp: 2_000 },
        options,
      ),
    ).toEqual({ status: "complete", errors: [] });
    expect(
      validateDateTimeRange(
        { startTimestamp: 1_000, endTimestamp: 2_001 },
        options,
      ),
    ).toEqual({
      status: "invalid",
      errors: [{ code: "maximum-duration-exceeded", target: "range" }],
    });
  });

  test("minute, second, and millisecond steps return targeted errors", () => {
    const startTimestamp = Date.UTC(2026, 0, 1, 0, 7, 3, 5);
    const endTimestamp = Date.UTC(2026, 0, 1, 0, 10, 4, 10);

    expect(
      validateDateTimeRange(
        { startTimestamp, endTimestamp },
        {
          steps: { minute: 5, second: 2, millisecond: 10 },
        },
      ),
    ).toEqual({
      status: "invalid",
      errors: [
        { code: "minute-step-mismatch", target: "start" },
        { code: "second-step-mismatch", target: "start" },
        { code: "millisecond-step-mismatch", target: "start" },
      ],
    });
  });

  test("required rejects an empty range", () => {
    expect(
      validateDateTimeRange(
        { startTimestamp: null, endTimestamp: null },
        { required: true },
      ),
    ).toEqual({
      status: "invalid",
      errors: [{ code: "required", target: "range" }],
    });
  });

  test("an invalid display timezone returns a structured error", () => {
    expect(
      validateDateTimeRange(
        { startTimestamp: 1_000, endTimestamp: 2_000 },
        { timezone: "Not/A_Timezone" },
      ),
    ).toEqual({
      status: "invalid",
      errors: [{ code: "invalid-timezone", target: "timezone" }],
    });
  });

  test("defaults impose no constraints and use unit steps", () => {
    expect(
      validateDateTimeRange({
        startTimestamp: -2_208_988_800_999,
        endTimestamp: 4_102_444_800_999,
      }),
    ).toEqual({ status: "complete", errors: [] });
  });

  test("simultaneous errors have deterministic structural-first order", () => {
    expect(
      validateDateTimeRange(
        { startTimestamp: 2_001, endTimestamp: 999 },
        {
          constraints: {
            minTimestamp: 1_000,
            maxTimestamp: 2_000,
            maxDurationMilliseconds: 100,
          },
        },
      ),
    ).toEqual({
      status: "invalid",
      errors: [
        { code: "end-not-after-start", target: "range" },
        { code: "after-maximum", target: "start" },
        { code: "before-minimum", target: "end" },
      ],
    });
  });
});
