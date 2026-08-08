import type { NormalizeTimestampOptions, Timestamp } from "./types.js";
import { isUnitBelowPrecision } from "./internal/precision.js";
import {
  getLocalDateTime,
  getTimezoneOffsetMinutes,
  resolveLocalDateTime,
} from "./internal/timezone.js";

export function normalizeTimestamp(
  timestamp: Timestamp,
  options: NormalizeTimestampOptions,
): Timestamp {
  const timezone = options.timezone ?? "UTC";
  const date = new Date(timestamp);

  if (timezone !== "UTC") {
    const originalOffset = getTimezoneOffsetMinutes(timestamp, timezone);
    const local = getLocalDateTime(timestamp, timezone);
    if (isUnitBelowPrecision("millisecond", options.precision)) {
      local.millisecond = 0;
    }
    if (isUnitBelowPrecision("second", options.precision)) local.second = 0;
    if (isUnitBelowPrecision("minute", options.precision)) local.minute = 0;
    if (isUnitBelowPrecision("hour", options.precision)) local.hour = 0;
    if (isUnitBelowPrecision("day", options.precision)) local.day = 1;
    if (isUnitBelowPrecision("month", options.precision)) local.month = 1;
    const resolution = resolveLocalDateTime(local, timezone);
    const matchingCandidate = resolution.candidates.find(
      (candidate) => candidate.offsetMinutes === originalOffset,
    );
    const candidate = matchingCandidate ?? resolution.candidates[0];
    if (candidate === undefined) {
      throw new RangeError("Normalized local time does not exist.");
    }
    return candidate.timestamp;
  }

  if (isUnitBelowPrecision("millisecond", options.precision)) {
    date.setUTCMilliseconds(0);
  }
  if (isUnitBelowPrecision("second", options.precision)) {
    date.setUTCSeconds(0);
  }
  if (isUnitBelowPrecision("minute", options.precision)) {
    date.setUTCMinutes(0);
  }
  if (isUnitBelowPrecision("hour", options.precision)) {
    date.setUTCHours(0);
  }
  if (isUnitBelowPrecision("day", options.precision)) {
    date.setUTCDate(1);
  }
  if (isUnitBelowPrecision("month", options.precision)) {
    date.setUTCMonth(0);
  }

  return date.getTime();
}
