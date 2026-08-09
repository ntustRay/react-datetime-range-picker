import { getLocalDateTime, validateTimezone } from "./timezone.js";
import type {
  DateTimeRangeConstraints,
  DateTimeRangeSteps,
  DateTimeRangeValidationError,
  DateTimeRangeValidationErrorCode,
  DateTimeRangeValidationResult,
  DateTimeRangeValidationTarget,
  DateTimeRangeValue,
  Timestamp,
  ValidateDateTimeRangeOptions,
} from "../types.js";

const DEFAULT_CONSTRAINTS: DateTimeRangeConstraints = {
  minTimestamp: null,
  maxTimestamp: null,
  maxDurationMilliseconds: null,
};

const DEFAULT_STEPS: DateTimeRangeSteps = {
  minute: 1,
  second: 1,
  millisecond: 1,
};

function error(
  code: DateTimeRangeValidationErrorCode,
  target: DateTimeRangeValidationTarget,
): DateTimeRangeValidationError {
  return { code, target };
}

function validateTimestampConstraints(
  timestamp: Timestamp,
  target: "start" | "end",
  constraints: DateTimeRangeConstraints,
  errors: DateTimeRangeValidationError[],
): void {
  if (
    constraints.minTimestamp !== null &&
    timestamp < constraints.minTimestamp
  ) {
    errors.push(error("before-minimum", target));
  }
  if (
    constraints.maxTimestamp !== null &&
    timestamp > constraints.maxTimestamp
  ) {
    errors.push(error("after-maximum", target));
  }
}

function validateTimestampSteps(
  timestamp: Timestamp,
  target: "start" | "end",
  timezone: string,
  steps: DateTimeRangeSteps,
  errors: DateTimeRangeValidationError[],
): void {
  const local = getLocalDateTime(timestamp, timezone);
  if (local.minute % steps.minute !== 0) {
    errors.push(error("minute-step-mismatch", target));
  }
  if (local.second % steps.second !== 0) {
    errors.push(error("second-step-mismatch", target));
  }
  if (local.millisecond % steps.millisecond !== 0) {
    errors.push(error("millisecond-step-mismatch", target));
  }
}

export function validateDateTimeRange(
  value: DateTimeRangeValue,
  options: ValidateDateTimeRangeOptions = {},
): DateTimeRangeValidationResult {
  const constraints = options.constraints ?? DEFAULT_CONSTRAINTS;
  const steps = options.steps ?? DEFAULT_STEPS;
  const timezone = options.timezone ?? "UTC";
  const errors: DateTimeRangeValidationError[] = [];

  try {
    validateTimezone(timezone);
  } catch {
    errors.push(error("invalid-timezone", "timezone"));
  }

  const { startTimestamp, endTimestamp } = value;
  if (startTimestamp === null && endTimestamp === null) {
    if (options.required === true) errors.push(error("required", "range"));
    return {
      status: errors.length === 0 ? "empty" : "invalid",
      errors,
    };
  }

  if (startTimestamp === null) {
    errors.push(error("end-without-start", "end"));
  }
  if (
    startTimestamp !== null &&
    endTimestamp !== null &&
    endTimestamp <= startTimestamp
  ) {
    errors.push(error("end-not-after-start", "range"));
  }

  if (startTimestamp !== null) {
    validateTimestampConstraints(startTimestamp, "start", constraints, errors);
    if (!errors.some((item) => item.code === "invalid-timezone")) {
      validateTimestampSteps(startTimestamp, "start", timezone, steps, errors);
    }
  }
  if (endTimestamp !== null) {
    validateTimestampConstraints(endTimestamp, "end", constraints, errors);
    if (!errors.some((item) => item.code === "invalid-timezone")) {
      validateTimestampSteps(endTimestamp, "end", timezone, steps, errors);
    }
  }
  if (
    startTimestamp !== null &&
    endTimestamp !== null &&
    constraints.maxDurationMilliseconds !== null &&
    endTimestamp - startTimestamp > constraints.maxDurationMilliseconds
  ) {
    errors.push(error("maximum-duration-exceeded", "range"));
  }

  if (errors.length > 0) return { status: "invalid", errors };
  return {
    status: endTimestamp === null ? "draft" : "complete",
    errors,
  };
}
