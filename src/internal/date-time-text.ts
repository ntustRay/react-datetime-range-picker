import { isUnitVisible } from "./precision.js";
import {
  getLocalDateTime,
  resolveLocalDateTime,
  type LocalDateTime,
  type LocalDateTimeCandidate,
} from "./timezone.js";
import type { Precision } from "../types.js";

type ParseLocalDateTimeStatus =
  | "valid"
  | "invalid"
  | "nonexistent"
  | "ambiguous";

interface ParseLocalDateTimeResult {
  status: ParseLocalDateTimeStatus;
  candidates: readonly LocalDateTimeCandidate[];
}

const PATTERNS: Record<Precision, RegExp> = {
  year: /^(\d{4})$/,
  month: /^(\d{4})-(\d{2})$/,
  day: /^(\d{4})-(\d{2})-(\d{2})$/,
  hour: /^(\d{4})-(\d{2})-(\d{2}) (\d{2})$/,
  minute: /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/,
  second: /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
  millisecond:
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$/,
};

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

export function getEditableDateTimeFormat(precision: Precision): string {
  let format = "YYYY";
  if (isUnitVisible("month", precision)) format += "-MM";
  if (isUnitVisible("day", precision)) format += "-DD";
  if (isUnitVisible("hour", precision)) format += " HH";
  if (isUnitVisible("minute", precision)) format += ":mm";
  if (isUnitVisible("second", precision)) format += ":ss";
  if (isUnitVisible("millisecond", precision)) format += ".SSS";
  return format;
}

export function formatEditableTimestamp(
  timestamp: number,
  timezone: string,
  precision: Precision,
): string {
  const local = getLocalDateTime(timestamp, timezone);
  let value = pad(local.year, 4);
  if (isUnitVisible("month", precision)) value += `-${pad(local.month)}`;
  if (isUnitVisible("day", precision)) value += `-${pad(local.day)}`;
  if (isUnitVisible("hour", precision)) value += ` ${pad(local.hour)}`;
  if (isUnitVisible("minute", precision)) value += `:${pad(local.minute)}`;
  if (isUnitVisible("second", precision)) value += `:${pad(local.second)}`;
  if (isUnitVisible("millisecond", precision)) {
    value += `.${pad(local.millisecond, 3)}`;
  }
  return value;
}

export function formatDisplayTimestamp(
  timestamp: number,
  timezone: string,
  locale: string,
  precision: Precision,
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
  };
  if (isUnitVisible("month", precision)) options.month = "2-digit";
  if (isUnitVisible("day", precision)) options.day = "2-digit";
  if (isUnitVisible("hour", precision)) {
    options.hour = "2-digit";
    options.hourCycle = "h23";
  }
  if (isUnitVisible("minute", precision)) options.minute = "2-digit";
  if (isUnitVisible("second", precision)) options.second = "2-digit";
  if (isUnitVisible("millisecond", precision)) {
    options.fractionalSecondDigits = 3;
  }
  return new Intl.DateTimeFormat(locale, options).format(timestamp);
}

function isCalendarDateValid(parts: LocalDateTime): boolean {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day &&
    parts.hour >= 0 &&
    parts.hour <= 23 &&
    parts.minute >= 0 &&
    parts.minute <= 59 &&
    parts.second >= 0 &&
    parts.second <= 59 &&
    parts.millisecond >= 0 &&
    parts.millisecond <= 999
  );
}

export function parseEditableDateTime(
  value: string,
  timezone: string,
  precision: Precision,
): ParseLocalDateTimeResult {
  const match = PATTERNS[precision].exec(value);
  if (match === null) return { status: "invalid", candidates: [] };
  const parts: LocalDateTime = {
    year: Number(match[1]),
    month: Number(match[2] ?? 1),
    day: Number(match[3] ?? 1),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
    second: Number(match[6] ?? 0),
    millisecond: Number(match[7] ?? 0),
  };
  if (!isCalendarDateValid(parts)) {
    return { status: "invalid", candidates: [] };
  }
  const resolution = resolveLocalDateTime(parts, timezone);
  return {
    status: resolution.status === "exact" ? "valid" : resolution.status,
    candidates: resolution.candidates,
  };
}

export type { ParseLocalDateTimeResult, ParseLocalDateTimeStatus };
