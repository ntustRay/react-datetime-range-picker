import type { NormalizeTimestampOptions, Timestamp } from "./types.js";
import { isUnitBelowPrecision } from "./internal/precision.js";

export function normalizeTimestamp(
  timestamp: Timestamp,
  options: NormalizeTimestampOptions,
): Timestamp {
  if (options.timezone !== "UTC") {
    throw new RangeError("Only UTC normalization is implemented.");
  }

  const date = new Date(timestamp);

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
