import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarMonthGrid } from "./calendar-month-grid.js";
import {
  createCalendarMonth,
  getFirstWeekdayIndex,
  moveCalendarMonth,
} from "./calendar.js";
import { normalizeTimestamp } from "./normalize-timestamp.js";
import { getLocalDateTime } from "./timezone.js";
import { getTestId } from "./test-id.js";
import type { DateTimeRangeDraftTarget } from "./date-time-range-draft.js";
import type {
  DateTimeRangeConstraints,
  DateTimeRangeLocaleText,
  DateTimeRangeTestIds,
  DateTimeRangeValue,
  Timestamp,
  Weekday,
} from "../types.js";

interface CalendarViewProps {
  value: DateTimeRangeValue;
  target: DateTimeRangeDraftTarget;
  timezone: string;
  locale: string;
  firstWeekday: Weekday | null;
  constraints: DateTimeRangeConstraints;
  localeText: DateTimeRangeLocaleText;
  testIds: Partial<DateTimeRangeTestIds> | undefined;
  onSelect: (timestamp: Timestamp) => void;
}

function getAnchor(
  timestamp: Timestamp | null,
  timezone: string,
): { year: number; month: number } {
  const local = getLocalDateTime(timestamp ?? Date.now(), timezone);
  return { year: local.year, month: local.month };
}

function getWeekdayLabels(locale: string, firstWeekdayIndex: number): string[] {
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
    getAnchor(
      props.target === "start"
        ? props.value.startTimestamp
        : (props.value.endTimestamp ?? props.value.startTimestamp),
      props.timezone,
    ),
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
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
  const selection = {
    constraints: props.constraints,
    target: props.target,
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

  useEffect(() => {
    const target = calendarRegionRef.current?.querySelector(
      `[data-calendar-grid="current"] [data-calendar-index="${focusedIndex}"]`,
    );
    if (target instanceof HTMLElement) target.focus();
  }, [displayed.year, displayed.month, focusedIndex]);

  useEffect(() => {
    const timestamp =
      props.target === "start"
        ? props.value.startTimestamp
        : (props.value.endTimestamp ?? props.value.startTimestamp);
    setDisplayed(getAnchor(timestamp, props.timezone));
  }, [
    props.target,
    props.timezone,
    props.value.startTimestamp,
    props.value.endTimestamp,
  ]);

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
          <span className="dtrp-active-target">
            {props.target === "start"
              ? props.localeText.startLabel
              : props.localeText.endLabel}
          </span>
          <h2>{monthLabel}</h2>
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
          calendar,
          label: monthLabel,
          weekdayLabels,
          locale: props.locale,
          timezone: props.timezone,
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
          active: true,
          index: focusedIndex,
          onFocus: setFocusedIndex,
          onMove: moveFocus,
          onChangeMonth: changeMonth,
        }}
        onSelect={props.onSelect}
      />
    </section>
  );
}
