import { isUnitVisible } from "./precision.js";
import {
  getLocalDateTime,
  resolveLocalDateTime,
  type LocalDateTime,
  type LocalDateTimeCandidate,
} from "./timezone.js";
import type { HourCycle, Precision } from "../types.js";

type ParseLocalDateTimeStatus =
  "valid" | "invalid" | "nonexistent" | "ambiguous";

interface ParseLocalDateTimeResult {
  status: ParseLocalDateTimeStatus;
  candidates: readonly LocalDateTimeCandidate[];
}

const PATTERNS: Record<Precision, RegExp> = {
  year: /^(\d{4})$/,
  month: /^(\d{4})\/(\d{2})$/,
  day: /^(\d{4})\/(\d{2})\/(\d{2})$/,
  hour: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2})$/,
  minute: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/,
  second: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
  millisecond: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$/,
};

const H12_PATTERNS: Record<Precision, RegExp> = {
  year: PATTERNS.year,
  month: PATTERNS.month,
  day: PATTERNS.day,
  hour: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}) (AM|PM)$/,
  minute: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}) (AM|PM)$/,
  second: /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/,
  millisecond:
    /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3}) (AM|PM)$/,
};

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

export function getEditableDateTimeFormat(
  precision: Precision,
  hourCycle: HourCycle = "h24",
): string {
  let format = "YYYY";
  if (isUnitVisible("month", precision)) format += "/MM";
  if (isUnitVisible("day", precision)) format += "/DD";
  if (isUnitVisible("hour", precision)) {
    format += hourCycle === "h12" ? " hh" : " HH";
  }
  if (isUnitVisible("minute", precision)) format += ":mm";
  if (isUnitVisible("second", precision)) format += ":ss";
  if (isUnitVisible("millisecond", precision)) format += ".SSS";
  if (hourCycle === "h12" && isUnitVisible("hour", precision)) {
    format += " AM";
  }
  return format;
}

export function formatEditableTimestamp(
  timestamp: number,
  timezone: string,
  precision: Precision,
  hourCycle: HourCycle = "h24",
): string {
  const local = getLocalDateTime(timestamp, timezone);
  let value = pad(local.year, 4);
  if (isUnitVisible("month", precision)) value += `/${pad(local.month)}`;
  if (isUnitVisible("day", precision)) value += `/${pad(local.day)}`;
  if (isUnitVisible("hour", precision)) {
    const hour = hourCycle === "h12" ? local.hour % 12 || 12 : local.hour;
    value += ` ${pad(hour)}`;
  }
  if (isUnitVisible("minute", precision)) value += `:${pad(local.minute)}`;
  if (isUnitVisible("second", precision)) value += `:${pad(local.second)}`;
  if (isUnitVisible("millisecond", precision)) {
    value += `.${pad(local.millisecond, 3)}`;
  }
  if (hourCycle === "h12" && isUnitVisible("hour", precision)) {
    value += local.hour < 12 ? " AM" : " PM";
  }
  return value;
}

export function formatDisplayTimestamp(
  timestamp: number,
  timezone: string,
  locale: string,
  precision: Precision,
  hourCycle: HourCycle = "h24",
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
  };
  if (isUnitVisible("month", precision)) options.month = "2-digit";
  if (isUnitVisible("day", precision)) options.day = "2-digit";
  if (isUnitVisible("hour", precision)) {
    options.hour = "2-digit";
    options.hourCycle = hourCycle === "h12" ? "h12" : "h23";
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
  hourCycle: HourCycle = "h24",
): ParseLocalDateTimeResult {
  const match = (hourCycle === "h12" ? H12_PATTERNS : PATTERNS)[precision].exec(
    value,
  );
  if (match === null) return { status: "invalid", candidates: [] };
  const parsedHour = Number(match[4] ?? 0);
  const periodIndex =
    precision === "hour"
      ? 5
      : precision === "minute"
        ? 6
        : precision === "second"
          ? 7
          : 8;
  const period = match[periodIndex];
  const hour =
    hourCycle === "h12" && isUnitVisible("hour", precision)
      ? (parsedHour % 12) + (period === "PM" ? 12 : 0)
      : parsedHour;
  const parts: LocalDateTime = {
    year: Number(match[1]),
    month: Number(match[2] ?? 1),
    day: Number(match[3] ?? 1),
    hour,
    minute: Number(match[5] ?? 0),
    second: Number(match[6] ?? 0),
    millisecond: precision === "millisecond" ? Number(match[7] ?? 0) : 0,
  };
  if (
    hourCycle === "h12" &&
    isUnitVisible("hour", precision) &&
    (parsedHour < 1 || parsedHour > 12)
  ) {
    return { status: "invalid", candidates: [] };
  }
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
