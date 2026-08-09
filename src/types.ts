export type Timestamp = number;

export type Timezone = string;

export type HourCycle = "h12" | "h24";

export type ColorScheme = "light" | "dark";

export interface DateTimeRangeValue {
  startTimestamp: Timestamp | null;
  endTimestamp: Timestamp | null;
}

export type Precision =
  "year" | "month" | "day" | "hour" | "minute" | "second" | "millisecond";

export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

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
  "start" | "end" | "range" | "timezone";

export interface DateTimeRangeValidationError {
  code: DateTimeRangeValidationErrorCode;
  target: DateTimeRangeValidationTarget;
}

export type DateTimeRangeValidationStatus =
  "empty" | "draft" | "complete" | "invalid";

export interface DateTimeRangeValidationResult {
  status: DateTimeRangeValidationStatus;
  errors: readonly DateTimeRangeValidationError[];
}

export interface DateTimeRangeLocaleText {
  triggerLabel: string;
  calendarLabel: string;
  startLabel: string;
  endLabel: string;
  previousMonthLabel: string;
  nextMonthLabel: string;
  calendarButtonLabel: string;
  timezoneLabel: string;
  applyButtonLabel: string;
  nextButtonLabel: string;
  cancelButtonLabel: string;
  clearButtonLabel: string;
  resetButtonLabel: string;
  rangeSummaryLabel: string;
  hourCycleLabel: string;
  hourCycle12Label: string;
  hourCycle24Label: string;
  hourColumnLabel: string;
  minuteColumnLabel: string;
  secondColumnLabel: string;
  millisecondColumnLabel: string;
  periodColumnLabel: string;
  amLabel: string;
  pmLabel: string;
  startFormatHint: string;
  endFormatHint: string;
  startTimeLabel: string;
  endTimeLabel: string;
  startOffsetLabel: string;
  endOffsetLabel: string;
  chooseOffsetLabel: string;
  earlierOffsetLabel: string;
  laterOffsetLabel: string;
  startDateStatusLabel: string;
  endDateStatusLabel: string;
  inRangeStatusLabel: string;
  validationEndWithoutStart: string;
  validationEndNotAfterStart: string;
  validationBeforeMinimum: string;
  validationAfterMaximum: string;
  validationMaximumDurationExceeded: string;
  validationMinuteStepMismatch: string;
  validationSecondStepMismatch: string;
  validationMillisecondStepMismatch: string;
  validationRequired: string;
  validationInvalidText: string;
  validationInvalidTimezone: string;
  validationNonexistentLocalTime: string;
  validationAmbiguousLocalTime: string;
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
  hourColumn: string;
  minuteColumn: string;
  secondColumn: string;
  millisecondColumn: string;
  periodColumn: string;
  hourCycle: string;
  timezone: string;
  presets: string;
  apply: string;
  next: string;
  cancel: string;
  clear: string;
  reset: string;
  rangeSummary: string;
  validation: string;
  dateCell: (timestamp: Timestamp) => string;
  preset: (presetId: string) => string;
}

export type DateTimeRangeChangeHandler = (value: DateTimeRangeValue) => void;

export type DateTimeRangeCommitHandler = (value: DateTimeRangeValue) => void;

export type DateTimeRangeTimezoneChangeHandler = (timezone: Timezone) => void;

export type DateTimeRangeHourCycleChangeHandler = (
  hourCycle: HourCycle,
) => void;

export type DateTimeRangeValidationChangeHandler = (
  result: DateTimeRangeValidationResult,
) => void;

export interface DateTimeRangePickerProps {
  value: DateTimeRangeValue;
  onChange: DateTimeRangeChangeHandler;
  onCommit: DateTimeRangeCommitHandler;
  timezone?: Timezone;
  onTimezoneChange?: DateTimeRangeTimezoneChangeHandler;
  hourCycle?: HourCycle;
  onHourCycleChange?: DateTimeRangeHourCycleChangeHandler;
  colorScheme?: ColorScheme;
  onValidationChange?: DateTimeRangeValidationChangeHandler;
  precision?: Precision;
  locale?: string;
  firstWeekday?: Weekday;
  constraints?: DateTimeRangeConstraints;
  steps?: DateTimeRangeSteps;
  features?: DateTimeRangeFeatures;
  timezoneOptions?: readonly Timezone[];
  presets?: readonly DateTimeRangePreset[];
  localeText?: Partial<DateTimeRangeLocaleText>;
  testIds?: Partial<DateTimeRangeTestIds>;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export interface NormalizeTimestampOptions {
  precision: Precision;
  timezone?: Timezone;
}

export interface ValidateDateTimeRangeOptions {
  constraints?: DateTimeRangeConstraints;
  steps?: DateTimeRangeSteps;
  required?: boolean;
  timezone?: Timezone;
}
