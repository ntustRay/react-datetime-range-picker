import type { Precision } from "../types.js";

export const PRECISION_UNITS: readonly Precision[] = [
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "millisecond",
];

export function isUnitVisible(unit: Precision, precision: Precision): boolean {
  return PRECISION_UNITS.indexOf(unit) <= PRECISION_UNITS.indexOf(precision);
}

export function isUnitBelowPrecision(
  unit: Precision,
  precision: Precision,
): boolean {
  return !isUnitVisible(unit, precision);
}
