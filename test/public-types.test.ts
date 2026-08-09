import { describe, expectTypeOf, test } from "vitest";

import type {
  ColorScheme,
  DateTimeRangeConstraints,
  DateTimeRangeFeatures,
  DateTimeRangeLocaleText,
  DateTimeRangePickerProps,
  DateTimeRangePreset,
  DateTimeRangeSteps,
  DateTimeRangeTestIds,
  DateTimeRangeValidationError,
  DateTimeRangeValidationErrorCode,
  DateTimeRangeValidationResult,
  DateTimeRangeValidationStatus,
  DateTimeRangeValidationTarget,
  DateTimeRangeValue,
  HourCycle,
  PopoverMode,
  Precision,
  Timestamp,
  Timezone,
  Weekday,
} from "@ntustray/react-datetime-range-picker";

describe("public domain types", () => {
  test("range values require nullable timestamp fields", () => {
    const emptyRange: DateTimeRangeValue = {
      startTimestamp: null,
      endTimestamp: null,
    };
    const completeRange: DateTimeRangeValue = {
      startTimestamp: 1_786_204_800_000,
      endTimestamp: 1_786_208_400_000,
    };

    expectTypeOf(emptyRange.startTimestamp).toEqualTypeOf<Timestamp | null>();
    expectTypeOf(completeRange.endTimestamp).toEqualTypeOf<Timestamp | null>();

    // @ts-expect-error Both fields are required even when the range is empty.
    const missingEnd: DateTimeRangeValue = { startTimestamp: null };
    const dateValue: DateTimeRangeValue = {
      // @ts-expect-error Public range values never accept Date objects.
      startTimestamp: new Date(),
      endTimestamp: null,
    };

    expectTypeOf(missingEnd).toMatchTypeOf<DateTimeRangeValue>();
    expectTypeOf(dateValue).toMatchTypeOf<DateTimeRangeValue>();
  });

  test("precision and weekday expose every fixed value", () => {
    expectTypeOf<Timezone>().toEqualTypeOf<string>();
    expectTypeOf<HourCycle>().toEqualTypeOf<"h12" | "h24">();
    expectTypeOf<ColorScheme>().toEqualTypeOf<"light" | "dark">();
    expectTypeOf<Precision>().toEqualTypeOf<
      "year" | "month" | "day" | "hour" | "minute" | "second" | "millisecond"
    >();
    expectTypeOf<Weekday>().toEqualTypeOf<
      | "sunday"
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
    >();
  });

  test("configuration groups keep their domain fields explicit", () => {
    expectTypeOf<DateTimeRangeConstraints>().toEqualTypeOf<{
      minTimestamp: Timestamp | null;
      maxTimestamp: Timestamp | null;
      maxDurationMilliseconds: number | null;
    }>();
    expectTypeOf<DateTimeRangeSteps>().toEqualTypeOf<{
      minute: number;
      second: number;
      millisecond: number;
    }>();
    expectTypeOf<DateTimeRangeFeatures>().toEqualTypeOf<{
      calendar: boolean;
      textInput: boolean;
      timezoneSelector: boolean;
    }>();
  });

  test("validation types expose stable states and identities", () => {
    expectTypeOf<DateTimeRangeValidationStatus>().toEqualTypeOf<
      "empty" | "draft" | "complete" | "invalid"
    >();
    expectTypeOf<DateTimeRangeValidationTarget>().toEqualTypeOf<
      "start" | "end" | "range" | "timezone"
    >();
    expectTypeOf<DateTimeRangeValidationErrorCode>().toEqualTypeOf<
      | "end-without-start"
      | "end-not-after-start"
      | "before-minimum"
      | "after-maximum"
      | "maximum-duration-exceeded"
      | "minute-step-mismatch"
      | "second-step-mismatch"
      | "millisecond-step-mismatch"
      | "required"
      | "invalid-text"
      | "invalid-timezone"
      | "nonexistent-local-time"
      | "ambiguous-local-time"
    >();
    expectTypeOf<DateTimeRangeValidationError>().toMatchTypeOf<{
      code: DateTimeRangeValidationErrorCode;
      target: DateTimeRangeValidationTarget;
    }>();
    expectTypeOf<DateTimeRangeValidationResult>().toMatchTypeOf<{
      status: DateTimeRangeValidationStatus;
      errors: readonly DateTimeRangeValidationError[];
    }>();
  });

  test("picker props use the controlled callbacks from the public contract", () => {
    expectTypeOf<DateTimeRangePickerProps["onChange"]>().toEqualTypeOf<
      (value: DateTimeRangeValue) => void
    >();
    expectTypeOf<DateTimeRangePickerProps["onCommit"]>().toEqualTypeOf<
      (value: DateTimeRangeValue) => void
    >();
    expectTypeOf<
      NonNullable<DateTimeRangePickerProps["onTimezoneChange"]>
    >().toEqualTypeOf<(timezone: string) => void>();
    expectTypeOf<
      NonNullable<DateTimeRangePickerProps["onHourCycleChange"]>
    >().toEqualTypeOf<(hourCycle: HourCycle) => void>();
    expectTypeOf<
      NonNullable<DateTimeRangePickerProps["popoverMode"]>
    >().toEqualTypeOf<PopoverMode>();

    const preset: DateTimeRangePreset = {
      id: "last-hour",
      label: "Last hour",
      getValue: ({ nowTimestamp }) => ({
        startTimestamp: nowTimestamp - 3_600_000,
        endTimestamp: nowTimestamp,
      }),
    };
    expectTypeOf(preset).toMatchTypeOf<DateTimeRangePreset>();

    expectTypeOf<
      DateTimeRangeLocaleText["applyButtonLabel"]
    >().toEqualTypeOf<string>();
    expectTypeOf<
      NonNullable<DateTimeRangePickerProps["localeText"]>
    >().toEqualTypeOf<Partial<DateTimeRangeLocaleText>>();
    expectTypeOf<DateTimeRangeTestIds["root"]>().toEqualTypeOf<string>();
  });

  test("seconds-specific timestamp configuration is not public API", () => {
    const value: DateTimeRangeValue = {
      startTimestamp: null,
      endTimestamp: null,
    };

    const props: DateTimeRangePickerProps = {
      value,
      onChange: () => undefined,
      onCommit: () => undefined,
      // @ts-expect-error Timestamps are always epoch milliseconds.
      timestampUnit: "seconds",
    };

    expectTypeOf(props).toMatchTypeOf<DateTimeRangePickerProps>();
  });
});
