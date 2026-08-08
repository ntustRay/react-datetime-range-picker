import { useEffect, useMemo, useRef, useState } from "react";

import {
  createCalendarMonth,
  getFirstWeekdayIndex,
  isCalendarDayDisabled,
  moveCalendarMonth,
} from "./calendar.js";
import { getLocalDateTime } from "./timezone.js";
import { normalizeTimestamp } from "../normalize-timestamp.js";
import type {
  DateTimeRangeConstraints,
  DateTimeRangeTestIds,
  DateTimeRangeValue,
  Timestamp,
  Weekday,
} from "../types.js";

interface CalendarViewProps {
  value: DateTimeRangeValue;
  timezone: string;
  locale: string;
  firstWeekday: Weekday | undefined;
  constraints: DateTimeRangeConstraints;
  testIds: Partial<DateTimeRangeTestIds> | undefined;
  onChange: (value: DateTimeRangeValue) => void;
}

function getAnchor(timestamp: Timestamp | null, timezone: string): {
  year: number;
  month: number;
} {
  const local = getLocalDateTime(timestamp ?? Date.now(), timezone);
  return { year: local.year, month: local.month };
}

function weekdayLabels(locale: string, firstWeekdayIndex: number): string[] {
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

export function CalendarView(props: CalendarViewProps): React.JSX.Element {
  const [displayed, setDisplayed] = useState(() =>
    getAnchor(props.value.startTimestamp, props.timezone),
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const target = gridRef.current?.querySelector(
      `[data-calendar-index="${focusedIndex}"]`,
    );
    if (target instanceof HTMLElement) target.focus();
  }, [displayed.year, displayed.month, focusedIndex]);

  const moveFocus = (nextIndex: number): void => {
    if (nextIndex >= 0 && nextIndex < calendar.days.length) {
      setFocusedIndex(nextIndex);
    }
  };

  const changeMonth = (offset: number): void => {
    setDisplayed(moveCalendarMonth(displayed.year, displayed.month, offset));
  };

  const monthLabel = new Intl.DateTimeFormat(props.locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(Date.UTC(displayed.year, displayed.month - 1, 1));

  return (
    <section aria-label="Calendar">
      <div>
        <button
          type="button"
          aria-label="Previous month"
          data-testid={props.testIds?.previousMonth ?? "dtrp-previous-month"}
          onClick={() => changeMonth(-1)}
        >
          ‹
        </button>
        <h2 aria-live="polite">{monthLabel}</h2>
        <button
          type="button"
          aria-label="Next month"
          data-testid={props.testIds?.nextMonth ?? "dtrp-next-month"}
          onClick={() => changeMonth(1)}
        >
          ›
        </button>
      </div>
      <div
        ref={gridRef}
        role="grid"
        aria-label={monthLabel}
        data-testid={props.testIds?.calendar ?? "dtrp-calendar"}
      >
        <div role="row">
          {weekdayLabels(props.locale, firstWeekdayIndex).map((label) => (
            <span key={label} role="columnheader">
              {label}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div key={rowIndex} role="row">
            {calendar.days
              .slice(rowIndex * 7, rowIndex * 7 + 7)
              .map((day, columnIndex) => {
                const index = rowIndex * 7 + columnIndex;
                const disabled = isCalendarDayDisabled(
                  day.timestamp,
                  selectingEnd,
                  props.value.startTimestamp,
                  props.constraints,
                );
                const selectedStart = day.timestamp === startDay;
                const selectedEnd = day.timestamp === endDay;
                const inRange =
                  day.timestamp !== null &&
                  startDay !== null &&
                  endDay !== null &&
                  day.timestamp > startDay &&
                  day.timestamp < endDay;
                const label = new Intl.DateTimeFormat(props.locale, {
                  dateStyle: "full",
                  timeZone: props.timezone,
                }).format(day.timestamp ?? 0);
                return (
                  <button
                    key={`${day.year}-${day.month}-${day.day}`}
                    type="button"
                    role="gridcell"
                    aria-label={label}
                    aria-selected={selectedStart || selectedEnd}
                    aria-current={day.timestamp === today ? "date" : undefined}
                    disabled={disabled}
                    tabIndex={index === focusedIndex ? 0 : -1}
                    data-calendar-index={index}
                    data-current-month={day.currentMonth}
                    data-in-range={inRange}
                    data-testid={
                      day.timestamp === null
                        ? undefined
                        : props.testIds?.dateCell?.(day.timestamp) ??
                          `dtrp-date-${day.timestamp}`
                    }
                    onFocus={() => setFocusedIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowLeft") moveFocus(index - 1);
                      else if (event.key === "ArrowRight") moveFocus(index + 1);
                      else if (event.key === "ArrowUp") moveFocus(index - 7);
                      else if (event.key === "ArrowDown") moveFocus(index + 7);
                      else if (event.key === "Home") moveFocus(index - columnIndex);
                      else if (event.key === "End") moveFocus(index + 6 - columnIndex);
                      else if (event.key === "PageUp") changeMonth(-1);
                      else if (event.key === "PageDown") changeMonth(1);
                      else return;
                      event.preventDefault();
                    }}
                    onClick={() => {
                      if (day.timestamp === null) return;
                      props.onChange(
                        selectingEnd
                          ? {
                              startTimestamp: props.value.startTimestamp,
                              endTimestamp: day.timestamp,
                            }
                          : {
                              startTimestamp: day.timestamp,
                              endTimestamp: null,
                            },
                      );
                    }}
                  >
                    {day.day}
                    {selectedStart ? <span> Start</span> : null}
                    {selectedEnd ? <span> End</span> : null}
                    {inRange ? <span> In range</span> : null}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </section>
  );
}
