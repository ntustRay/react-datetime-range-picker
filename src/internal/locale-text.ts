import type {
  DateTimeRangeLocaleText,
  DateTimeRangeValidationErrorCode,
  Precision,
} from "../types.js";
import { getEditableDateTimeFormat } from "./date-time-text.js";
import { getBuiltInLocaleText } from "../locales.js";

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
  locale: string,
  overrides: Partial<DateTimeRangeLocaleText> | undefined,
  precision: Precision,
  hourCycle: "h12" | "h24",
): DateTimeRangeLocaleText {
  const defaultFormatHint = getEditableDateTimeFormat(precision, hourCycle);
  return {
    ...getBuiltInLocaleText(locale),
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
