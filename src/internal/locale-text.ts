import type {
  DateTimeRangeLocaleText,
  DateTimeRangeValidationErrorCode,
  Precision,
} from "../types.js";
import { getEditableDateTimeFormat } from "./date-time-text.js";

const DEFAULT_LOCALE_TEXT: DateTimeRangeLocaleText = {
  triggerLabel: "Select date and time range",
  calendarLabel: "Calendar",
  startLabel: "Start",
  endLabel: "End",
  previousMonthLabel: "Previous month",
  nextMonthLabel: "Next month",
  timezoneLabel: "Time zone",
  applyButtonLabel: "Apply",
  cancelButtonLabel: "Cancel",
  clearButtonLabel: "Clear",
  startFormatHint: "",
  endFormatHint: "",
  startTimeLabel: "Start time",
  endTimeLabel: "End time",
  startOffsetLabel: "Start offset",
  endOffsetLabel: "End offset",
  chooseOffsetLabel: "Choose an offset",
  earlierOffsetLabel: "Earlier",
  laterOffsetLabel: "Later",
  startDateStatusLabel: "Start",
  endDateStatusLabel: "End",
  inRangeStatusLabel: "In range",
  validationEndWithoutStart: "Choose a start before the end.",
  validationEndNotAfterStart: "End must be after start.",
  validationBeforeMinimum: "The value is before the minimum.",
  validationAfterMaximum: "The value is after the maximum.",
  validationMaximumDurationExceeded: "The range is longer than allowed.",
  validationMinuteStepMismatch: "The minute does not match the required step.",
  validationSecondStepMismatch: "The second does not match the required step.",
  validationMillisecondStepMismatch:
    "The millisecond does not match the required step.",
  validationRequired: "A date-time range is required.",
  validationInvalidText: "Enter a valid date and time.",
  validationInvalidTimezone: "Choose a valid IANA timezone.",
  validationNonexistentLocalTime: "This local time does not exist.",
  validationAmbiguousLocalTime: "Choose an offset for this repeated local time.",
};

const VALIDATION_MESSAGE_KEYS: Record<
  DateTimeRangeValidationErrorCode,
  keyof DateTimeRangeLocaleText
> = {
  "end-without-start": "validationEndWithoutStart",
  "end-not-after-start": "validationEndNotAfterStart",
  "before-minimum": "validationBeforeMinimum",
  "after-maximum": "validationAfterMaximum",
  "maximum-duration-exceeded": "validationMaximumDurationExceeded",
  "minute-step-mismatch": "validationMinuteStepMismatch",
  "second-step-mismatch": "validationSecondStepMismatch",
  "millisecond-step-mismatch": "validationMillisecondStepMismatch",
  required: "validationRequired",
  "invalid-text": "validationInvalidText",
  "invalid-timezone": "validationInvalidTimezone",
  "nonexistent-local-time": "validationNonexistentLocalTime",
  "ambiguous-local-time": "validationAmbiguousLocalTime",
};

export function resolveLocaleText(
  overrides: Partial<DateTimeRangeLocaleText> | undefined,
  precision: Precision,
): DateTimeRangeLocaleText {
  const defaultFormatHint = getEditableDateTimeFormat(precision);
  return {
    ...DEFAULT_LOCALE_TEXT,
    startFormatHint: defaultFormatHint,
    endFormatHint: defaultFormatHint,
    ...overrides,
  };
}

export function getValidationMessage(
  localeText: DateTimeRangeLocaleText,
  code: DateTimeRangeValidationErrorCode,
): string {
  return localeText[VALIDATION_MESSAGE_KEYS[code]];
}
