# Version 1 Public API Contract

This document fixes the initial public names and configuration shapes for the
package. It describes the consumer-facing contract; implementation details and
internal state types are intentionally excluded.

## Values and Fixed States

```ts
export type Timestamp = number;

export type Timezone = string;

export interface DateTimeRangeValue {
  startTimestamp: Timestamp | null;
  endTimestamp: Timestamp | null;
}

export type Precision =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";
```

`Timestamp` always means Unix epoch milliseconds. The package does not accept
`Date`, ISO strings, seconds-based timestamps, or fixed-offset strings as range
values. Both range fields exist at all times; an empty value uses two explicit
`null` fields.

## Configuration Groups

Configuration groups are complete when supplied. Consumers omit the whole prop
to use its defaults rather than constructing partially defined domain objects.

```ts
export interface DateTimeRangeConstraints {
  minTimestamp: Timestamp | null;
  maxTimestamp: Timestamp | null;
  maxDurationMilliseconds: number | null;
}

export interface DateTimeRangeSteps {
  minute: number;
  second: number;
  millisecond: number;
}

export interface DateTimeRangeFeatures {
  calendar: boolean;
  textInput: boolean;
  timezoneSelector: boolean;
}

export interface DateTimeRangePresetContext {
  nowTimestamp: Timestamp;
  timezone: Timezone;
  precision: Precision;
}

export interface DateTimeRangePreset {
  id: string;
  label: string;
  getValue: (context: DateTimeRangePresetContext) => DateTimeRangeValue;
}
```

The default constraints are all `null`; the default step for each unit is `1`.
Calendar, text input, and time-zone selection are enabled by default. At least
one of `calendar` or `textInput` must remain enabled. Presets are evaluated when
activated, not during render.

## Validation

```ts
export type DateTimeRangeValidationErrorCode =
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
  | "ambiguous-local-time";

export type DateTimeRangeValidationTarget =
  | "start"
  | "end"
  | "range"
  | "timezone";

export interface DateTimeRangeValidationError {
  code: DateTimeRangeValidationErrorCode;
  target: DateTimeRangeValidationTarget;
}

export type DateTimeRangeValidationStatus =
  | "empty"
  | "draft"
  | "complete"
  | "invalid";

export interface DateTimeRangeValidationResult {
  status: DateTimeRangeValidationStatus;
  errors: readonly DateTimeRangeValidationError[];
}
```

Stable codes and targets identify errors; localized text never does. A required
empty range is `invalid`, a start-only range is `draft`, and only a complete
range may be committed.

## Labels and Test IDs

```ts
export interface DateTimeRangeLabels {
  trigger: string;
  start: string;
  end: string;
  previousMonth: string;
  nextMonth: string;
  timezone: string;
  apply: string;
  cancel: string;
  clear: string;
  startFormatHint: string;
  endFormatHint: string;
  earlierOffset: string;
  laterOffset: string;
}

export interface DateTimeRangeTestIds {
  root: string;
  trigger: string;
  popover: string;
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  startInput: string;
  endInput: string;
  startTime: string;
  endTime: string;
  timezone: string;
  presets: string;
  apply: string;
  cancel: string;
  clear: string;
  validation: string;
  dateCell: (timestamp: Timestamp) => string;
  preset: (presetId: string) => string;
}
```

`labels` and `testIds` are partial overrides because omission intentionally
retains a package default. Empty custom test IDs are invalid. Default IDs use
the `dtrp-` prefix, including `dtrp-date-{timestamp}` and
`dtrp-preset-{presetId}` for dynamic controls.

Validation messages are customized with a formatter that receives both the
structured error and the package's localized fallback:

```ts
export type DateTimeRangeValidationMessageFormatter = (
  error: DateTimeRangeValidationError,
  defaultMessage: string,
) => string;
```

## Component Props and Callbacks

```ts
export interface DateTimeRangePickerProps {
  value: DateTimeRangeValue;
  onChange: (value: DateTimeRangeValue) => void;
  onCommit: (value: DateTimeRangeValue) => void;

  timezone?: Timezone;
  onTimezoneChange?: (timezone: Timezone) => void;
  onValidationChange?: (result: DateTimeRangeValidationResult) => void;

  precision?: Precision;
  locale?: string;
  firstWeekday?: Weekday;
  constraints?: DateTimeRangeConstraints;
  steps?: DateTimeRangeSteps;
  features?: DateTimeRangeFeatures;
  timezoneOptions?: readonly Timezone[];
  presets?: readonly DateTimeRangePreset[];
  labels?: Partial<DateTimeRangeLabels>;
  formatValidationMessage?: DateTimeRangeValidationMessageFormatter;
  testIds?: Partial<DateTimeRangeTestIds>;

  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export declare function DateTimeRangePicker(
  props: DateTimeRangePickerProps,
): React.JSX.Element;
```

Omitted optional props select documented defaults; they do not represent
missing domain fields. Defaults are UTC, second precision, English locale,
locale-derived first weekday, no constraints, unit steps of `1`, no presets,
and enabled Clear. The range remains controlled. `onChange` reports draft
edits, while `onCommit` fires only after Apply accepts a complete valid range.
Callbacks do not receive metadata in Version 1 because no agreed behavior
requires interaction provenance.

## Public Pure Helpers

The package exports the two pure helper seams already required for consumer
validation and deterministic date calculations:

```ts
export interface NormalizeTimestampOptions {
  precision: Precision;
  timezone?: Timezone;
}

export declare function normalizeTimestamp(
  timestamp: Timestamp,
  options: NormalizeTimestampOptions,
): Timestamp;

export interface ValidateDateTimeRangeOptions {
  constraints?: DateTimeRangeConstraints;
  steps?: DateTimeRangeSteps;
  required?: boolean;
  timezone?: Timezone;
}

export declare function validateDateTimeRange(
  value: DateTimeRangeValue,
  options?: ValidateDateTimeRangeOptions,
): DateTimeRangeValidationResult;
```

Calendar generation, local-part conversion, draft reducers, parsing, focus
management, and individual UI elements remain internal.

## Initial CSS Contract

The public stylesheet uses component-scoped selectors and these initial custom
properties:

```css
--dtrp-font-family
--dtrp-font-size
--dtrp-space
--dtrp-radius
--dtrp-surface
--dtrp-surface-muted
--dtrp-text
--dtrp-border
--dtrp-accent
--dtrp-range
--dtrp-focus
--dtrp-error
--dtrp-disabled-opacity
```

The popover switches from one month to two at a `40rem` container inline size.
