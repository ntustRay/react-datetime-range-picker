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
  if (constraints.minTimestamp !== null && timestamp < constraints.minTimestamp) {
    return true;
  }
  if (constraints.maxTimestamp !== null && timestamp > constraints.maxTimestamp) {
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
