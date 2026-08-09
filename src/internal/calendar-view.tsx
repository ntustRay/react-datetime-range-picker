import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarMonthGrid } from "./calendar-month-grid.js";
import {
  createCalendarMonth,
  getFirstWeekdayIndex,
  moveCalendarMonth,
} from "./calendar.js";
import { getLocalDateTime } from "./timezone.js";
import { getTestId } from "./test-id.js";
import { normalizeTimestamp } from "../normalize-timestamp.js";
import type {
  DateTimeRangeConstraints,
  DateTimeRangeLocaleText,
  DateTimeRangeTestIds,
  DateTimeRangeValue,
  Timestamp,
  Weekday,
} from "../types.js";

type FocusedCalendar = "current" | "following";

interface CalendarViewProps {
  value: DateTimeRangeValue;
  timezone: string;
  locale: string;
  firstWeekday: Weekday | undefined;
  constraints: DateTimeRangeConstraints;
  localeText: DateTimeRangeLocaleText;
  testIds: Partial<DateTimeRangeTestIds> | undefined;
  onChange: (value: DateTimeRangeValue) => void;
}

function getAnchor(
  timestamp: Timestamp | null,
  timezone: string,
): { year: number; month: number } {
  const local = getLocalDateTime(timestamp ?? Date.now(), timezone);
  return { year: local.year, month: local.month };
}

function getWeekdayLabels(
  locale: string,
  firstWeekdayIndex: number,
): string[] {
  const labels: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const sundayBasedIndex = (firstWeekdayIndex + index) % 7;
    const date = Date.UTC(2026, 0, 4 + sundayBasedIndex);
    labels.push(
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
    );
  }
  return labels;
}

function getMonthLabel(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(Date.UTC(year, month - 1, 1));
}

export function CalendarView(props: CalendarViewProps): React.JSX.Element {
  const [displayed, setDisplayed] = useState(() =>
    getAnchor(props.value.startTimestamp, props.timezone),
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [focusedCalendar, setFocusedCalendar] =
    useState<FocusedCalendar>("current");
  const calendarRegionRef = useRef<HTMLElement>(null);

  const firstWeekdayIndex = getFirstWeekdayIndex(
    props.locale,
    props.firstWeekday,
  );
  const calendar = useMemo(
    () =>
      createCalendarMonth(
        displayed.year,
        displayed.month,
        props.timezone,
        firstWeekdayIndex,
      ),
    [displayed.year, displayed.month, props.timezone, firstWeekdayIndex],
  );
  const followingMonth = moveCalendarMonth(
    displayed.year,
    displayed.month,
    1,
  );
  const followingCalendar = useMemo(
    () =>
      createCalendarMonth(
        followingMonth.year,
        followingMonth.month,
        props.timezone,
        firstWeekdayIndex,
      ),
    [
      followingMonth.year,
      followingMonth.month,
      props.timezone,
      firstWeekdayIndex,
    ],
  );
  const selectingEnd =
    props.value.startTimestamp !== null && props.value.endTimestamp === null;
  const startDay =
    props.value.startTimestamp === null
      ? null
      : normalizeTimestamp(props.value.startTimestamp, {
          precision: "day",
          timezone: props.timezone,
        });
  const endDay =
    props.value.endTimestamp === null
      ? null
      : normalizeTimestamp(props.value.endTimestamp, {
          precision: "day",
          timezone: props.timezone,
        });
  const today = normalizeTimestamp(Date.now(), {
    precision: "day",
    timezone: props.timezone,
  });
  const weekdayLabels = getWeekdayLabels(props.locale, firstWeekdayIndex);
  const monthLabel = getMonthLabel(
    props.locale,
    displayed.year,
    displayed.month,
  );
  const followingMonthLabel = getMonthLabel(
    props.locale,
    followingMonth.year,
    followingMonth.month,
  );
  const selection = {
    value: props.value,
    constraints: props.constraints,
    selectingEnd,
    startDay,
    endDay,
    today,
  };

  const moveFocus = (nextIndex: number): void => {
    if (nextIndex >= 0 && nextIndex < calendar.days.length) {
      setFocusedIndex(nextIndex);
    }
  };

  const changeMonth = (offset: number): void => {
    setDisplayed(moveCalendarMonth(displayed.year, displayed.month, offset));
  };

  const focusCalendar = (
    target: FocusedCalendar,
    index: number,
  ): void => {
    setFocusedCalendar(target);
    setFocusedIndex(index);
  };

  useEffect(() => {
    const target = calendarRegionRef.current?.querySelector(
      `[data-calendar-grid="${focusedCalendar}"] [data-calendar-index="${focusedIndex}"]`,
    );
    if (target instanceof HTMLElement) target.focus();
  }, [displayed.year, displayed.month, focusedCalendar, focusedIndex]);

  return (
    <section
      ref={calendarRegionRef}
      aria-label={props.localeText.calendarLabel}
      className="dtrp-calendar-region"
    >
      <div className="dtrp-calendar-navigation">
        <button
          type="button"
          aria-label={props.localeText.previousMonthLabel}
          data-testid={getTestId(
            props.testIds?.previousMonth,
            "dtrp-previous-month",
          )}
          onClick={() => changeMonth(-1)}
        >
          ‹
        </button>
        <div className="dtrp-calendar-months" aria-live="polite">
          <h2>{monthLabel}</h2>
          <h2 className="dtrp-calendar-wide">{followingMonthLabel}</h2>
        </div>
        <button
          type="button"
          aria-label={props.localeText.nextMonthLabel}
          data-testid={getTestId(props.testIds?.nextMonth, "dtrp-next-month")}
          onClick={() => changeMonth(1)}
        >
          ›
        </button>
      </div>
      <CalendarMonthGrid
        presentation={{
          gridName: "current",
          calendar,
          label: monthLabel,
          weekdayLabels,
          locale: props.locale,
          timezone: props.timezone,
          className: null,
          responsive: false,
          calendarTestId: getTestId(props.testIds?.calendar, "dtrp-calendar"),
          dateTestId: (timestamp) =>
            getTestId(
              props.testIds?.dateCell?.(timestamp),
              `dtrp-date-${timestamp}`,
            ),
          startDateStatusLabel: props.localeText.startDateStatusLabel,
          endDateStatusLabel: props.localeText.endDateStatusLabel,
          inRangeStatusLabel: props.localeText.inRangeStatusLabel,
        }}
        selection={selection}
        focus={{
          active: focusedCalendar === "current",
          index: focusedIndex,
          onFocus: (index) => focusCalendar("current", index),
          onMove: moveFocus,
          onChangeMonth: changeMonth,
        }}
        onChange={props.onChange}
      />
      <CalendarMonthGrid
        presentation={{
          gridName: "following",
          calendar: followingCalendar,
          label: followingMonthLabel,
          weekdayLabels,
          locale: props.locale,
          timezone: props.timezone,
          className: "dtrp-calendar-wide",
          responsive: true,
          calendarTestId: null,
          dateTestId: null,
          startDateStatusLabel: props.localeText.startDateStatusLabel,
          endDateStatusLabel: props.localeText.endDateStatusLabel,
          inRangeStatusLabel: props.localeText.inRangeStatusLabel,
        }}
        selection={selection}
        focus={{
          active: focusedCalendar === "following",
          index: focusedIndex,
          onFocus: (index) => focusCalendar("following", index),
          onMove: moveFocus,
          onChangeMonth: changeMonth,
        }}
        onChange={props.onChange}
      />
    </section>
  );
}
