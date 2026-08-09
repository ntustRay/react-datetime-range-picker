import { resolveLocalDateTime } from "./timezone.js";
import type { DateTimeRangeConstraints, Timestamp, Weekday } from "../types.js";

interface CalendarDay {
  year: number;
  month: number;
  day: number;
  timestamp: Timestamp | null;
  currentMonth: boolean;
}

interface CalendarMonth {
  year: number;
  month: number;
  days: readonly CalendarDay[];
}

interface CalendarAvailabilityOptions {
  target: "start" | "end";
  startDay: Timestamp | null;
  endDay: Timestamp | null;
  constraints: DateTimeRangeConstraints;
  timezone: string;
}

interface CalendarMonthAvailabilityOptions extends CalendarAvailabilityOptions {
  year: number;
  month: number;
}

interface CalendarYearAvailabilityOptions extends CalendarAvailabilityOptions {
  year: number;
}

const WEEKDAY_INDEX: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function getFirstWeekdayIndex(
  locale: string,
  override: Weekday | null,
): number {
  if (override !== null) return WEEKDAY_INDEX[override];
  const localeInfo: unknown = new Intl.Locale(locale);
  let firstDay: number;
  if (
    typeof localeInfo === "object" &&
    localeInfo !== null &&
    "weekInfo" in localeInfo &&
    typeof localeInfo.weekInfo === "object" &&
    localeInfo.weekInfo !== null &&
    "firstDay" in localeInfo.weekInfo &&
    typeof localeInfo.weekInfo.firstDay === "number"
  ) {
    firstDay = localeInfo.weekInfo.firstDay;
  } else {
    firstDay = new Intl.Locale(locale).getWeekInfo().firstDay;
  }
  return firstDay === 7 ? 0 : firstDay;
}

export function moveCalendarMonth(
  year: number,
  month: number,
  offset: number,
): { year: number; month: number } {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1 + offset, 1);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function localMidnightTimestamp(
  year: number,
  month: number,
  day: number,
  timezone: string,
): Timestamp | null {
  const resolution = resolveLocalDateTime(
    { year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 },
    timezone,
  );
  return resolution.candidates[0]?.timestamp ?? null;
}

function getSelectableBounds(options: CalendarAvailabilityOptions): {
  minimum: Timestamp | null;
  maximum: Timestamp | null;
} {
  let minimum = options.constraints.minTimestamp;
  let maximum = options.constraints.maxTimestamp;
  const maximumDuration = options.constraints.maxDurationMilliseconds;

  if (options.target === "end" && options.startDay !== null) {
    minimum =
      minimum === null ? options.startDay : Math.max(minimum, options.startDay);
    if (maximumDuration !== null) {
      const durationMaximum = options.startDay + maximumDuration;
      maximum =
        maximum === null ? durationMaximum : Math.min(maximum, durationMaximum);
    }
  }

  if (options.target === "start" && options.endDay !== null) {
    maximum =
      maximum === null ? options.endDay : Math.min(maximum, options.endDay);
    if (maximumDuration !== null) {
      const durationMinimum = options.endDay - maximumDuration;
      minimum =
        minimum === null ? durationMinimum : Math.max(minimum, durationMinimum);
    }
  }

  return { minimum, maximum };
}

function getLastDayOfMonth(year: number, month: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}

function isCalendarPeriodDisabled(
  firstDay: Timestamp | null,
  lastDay: Timestamp | null,
  options: CalendarAvailabilityOptions,
): boolean {
  if (firstDay === null || lastDay === null) return true;
  const bounds = getSelectableBounds(options);
  if (bounds.minimum !== null && lastDay < bounds.minimum) return true;
  if (bounds.maximum !== null && firstDay > bounds.maximum) return true;
  return (
    bounds.minimum !== null &&
    bounds.maximum !== null &&
    bounds.minimum > bounds.maximum
  );
}

export function getYearPageStart(year: number): number {
  return year - 5;
}

export function isCalendarMonthDisabled(
  options: CalendarMonthAvailabilityOptions,
): boolean {
  const firstDay = localMidnightTimestamp(
    options.year,
    options.month,
    1,
    options.timezone,
  );
  const lastDay = localMidnightTimestamp(
    options.year,
    options.month,
    getLastDayOfMonth(options.year, options.month),
    options.timezone,
  );
  return isCalendarPeriodDisabled(firstDay, lastDay, options);
}

export function isCalendarYearDisabled(
  options: CalendarYearAvailabilityOptions,
): boolean {
  const firstDay = localMidnightTimestamp(options.year, 1, 1, options.timezone);
  const lastDay = localMidnightTimestamp(
    options.year,
    12,
    31,
    options.timezone,
  );
  return isCalendarPeriodDisabled(firstDay, lastDay, options);
}

export function createCalendarMonth(
  year: number,
  month: number,
  timezone: string,
  firstWeekdayIndex: number,
): CalendarMonth {
  const first = new Date(0);
  first.setUTCFullYear(year, month - 1, 1);
  const leadingDays = (first.getUTCDay() - firstWeekdayIndex + 7) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(1 - leadingDays);
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    const dayYear = date.getUTCFullYear();
    const dayMonth = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    days.push({
      year: dayYear,
      month: dayMonth,
      day,
      timestamp: localMidnightTimestamp(dayYear, dayMonth, day, timezone),
      currentMonth: dayYear === year && dayMonth === month,
    });
  }

  return { year, month, days };
}

export function isCalendarDayDisabled(
  timestamp: Timestamp | null,
  target: "start" | "end",
  startDay: Timestamp | null,
  endDay: Timestamp | null,
  constraints: DateTimeRangeConstraints,
): boolean {
  if (timestamp === null) return true;
  if (
    constraints.minTimestamp !== null &&
    timestamp < constraints.minTimestamp
  ) {
    return true;
  }
  if (
    constraints.maxTimestamp !== null &&
    timestamp > constraints.maxTimestamp
  ) {
    return true;
  }
  if (target === "end" && startDay !== null) {
    if (timestamp < startDay) return true;
    if (
      constraints.maxDurationMilliseconds !== null &&
      timestamp - startDay > constraints.maxDurationMilliseconds
    ) {
      return true;
    }
  }
  if (target === "start" && endDay !== null) {
    if (timestamp > endDay) return true;
    if (
      constraints.maxDurationMilliseconds !== null &&
      endDay - timestamp > constraints.maxDurationMilliseconds
    ) {
      return true;
    }
  }
  return false;
}

export type { CalendarDay, CalendarMonth };
