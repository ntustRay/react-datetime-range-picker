import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarMonthGrid } from "./calendar-month-grid.js";
import {
  CalendarPeriodGrid,
  type CalendarPeriodOption,
} from "./calendar-period-grid.js";
import {
  createCalendarMonth,
  getFirstWeekdayIndex,
  getYearPageStart,
  isCalendarMonthDisabled,
  isCalendarYearDisabled,
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

type CalendarViewMode = "day" | "month" | "year";
type CalendarHeaderSegment = "month" | "year";

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

function getCalendarLabelDate(year: number, month: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, 1);
  return date;
}

function getMonthLabel(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(getCalendarLabelDate(year, month));
}

function getMonthName(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  }).format(getCalendarLabelDate(year, month));
}

function getYearLabel(locale: string, year: number): string {
  const date = new Date(0);
  date.setUTCFullYear(year, 0, 1);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getHeaderOrder(
  locale: string,
  year: number,
  month: number,
): readonly CalendarHeaderSegment[] {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatToParts(getCalendarLabelDate(year, month));
  const monthIndex = parts.findIndex((part) => part.type === "month");
  const yearIndex = parts.findIndex((part) => part.type === "year");
  return monthIndex < yearIndex ? ["month", "year"] : ["year", "month"];
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
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart(displayed.year),
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
  const monthName = getMonthName(props.locale, displayed.year, displayed.month);
  const yearLabel = getYearLabel(props.locale, displayed.year);
  const headerOrder = getHeaderOrder(
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
  const monthOptions: CalendarPeriodOption[] = [];
  const yearOptions: CalendarPeriodOption[] = [];

  for (let month = 1; month <= 12; month += 1) {
    monthOptions.push({
      value: month,
      label: getMonthName(props.locale, displayed.year, month),
      selected: month === displayed.month,
      disabled: isCalendarMonthDisabled({
        year: displayed.year,
        month,
        target: props.target,
        startDay,
        endDay,
        constraints: props.constraints,
        timezone: props.timezone,
      }),
    });
  }

  for (let offset = 0; offset < 12; offset += 1) {
    const year = yearPageStart + offset;
    yearOptions.push({
      value: year,
      label: getYearLabel(props.locale, year),
      selected: year === displayed.year,
      disabled: isCalendarYearDisabled({
        year,
        target: props.target,
        startDay,
        endDay,
        constraints: props.constraints,
        timezone: props.timezone,
      }),
    });
  }

  const moveFocus = (nextIndex: number): void => {
    if (nextIndex >= 0 && nextIndex < calendar.days.length) {
      setFocusedIndex(nextIndex);
    }
  };

  const changeMonth = (offset: number): void => {
    setDisplayed(moveCalendarMonth(displayed.year, displayed.month, offset));
  };

  const changePeriodPage = (offset: -1 | 1): void => {
    if (viewMode === "year") {
      setYearPageStart((current) => current + offset * 12);
      return;
    }
    setDisplayed((current) => ({
      year: current.year + offset,
      month: current.month,
    }));
  };

  const selectYear = (year: number): void => {
    setDisplayed((current) => ({ year, month: current.month }));
    setYearPageStart(getYearPageStart(year));
    setViewMode("month");
  };

  const selectMonth = (month: number): void => {
    setDisplayed((current) => ({ year: current.year, month }));
    setFocusedIndex(0);
    setViewMode("day");
  };

  const togglePeriodView = (mode: "month" | "year"): void => {
    setViewMode((current) => (current === mode ? "day" : mode));
  };

  const changeNavigationPage = (offset: -1 | 1): void => {
    if (viewMode === "day") changeMonth(offset);
    else changePeriodPage(offset);
  };

  useEffect(() => {
    if (viewMode !== "day") return;
    const target = calendarRegionRef.current?.querySelector(
      `[data-calendar-grid="current"] [data-calendar-index="${focusedIndex}"]`,
    );
    if (target instanceof HTMLElement) target.focus();
  }, [displayed.year, displayed.month, focusedIndex, viewMode]);

  useEffect(() => {
    const timestamp =
      props.target === "start"
        ? props.value.startTimestamp
        : (props.value.endTimestamp ?? props.value.startTimestamp);
    const anchor = getAnchor(timestamp, props.timezone);
    setDisplayed(anchor);
    setYearPageStart(getYearPageStart(anchor.year));
    setViewMode("day");
  }, [
    props.target,
    props.timezone,
    props.value.startTimestamp,
    props.value.endTimestamp,
  ]);

  const previousNavigationLabel =
    viewMode === "day"
      ? props.localeText.previousMonthLabel
      : viewMode === "month"
        ? props.localeText.previousYearLabel
        : props.localeText.previousYearPageLabel;
  const nextNavigationLabel =
    viewMode === "day"
      ? props.localeText.nextMonthLabel
      : viewMode === "month"
        ? props.localeText.nextYearLabel
        : props.localeText.nextYearPageLabel;

  return (
    <section
      ref={calendarRegionRef}
      aria-label={props.localeText.calendarLabel}
      className="dtrp-calendar-region"
      data-view={viewMode}
    >
      <div className="dtrp-calendar-navigation">
        <button
          type="button"
          aria-label={previousNavigationLabel}
          data-testid={getTestId(
            viewMode === "day" ? props.testIds?.previousMonth : undefined,
            viewMode === "day" ? "dtrp-previous-month" : "dtrp-previous-period",
          )}
          onClick={() => changeNavigationPage(-1)}
        >
          ‹
        </button>
        <div className="dtrp-calendar-months" aria-live="polite">
          <span className="dtrp-active-target">
            {props.target === "start"
              ? props.localeText.startLabel
              : props.localeText.endLabel}
          </span>
          <h2>
            <span className="dtrp-period-controls">
              {headerOrder.map((segment) =>
                segment === "year" ? (
                  <button
                    key="year"
                    type="button"
                    aria-label={`${props.localeText.chooseYearLabel}: ${yearLabel}`}
                    aria-expanded={viewMode === "year"}
                    data-active={viewMode === "year"}
                    onClick={() => togglePeriodView("year")}
                  >
                    {yearLabel}
                    <span aria-hidden="true">⌄</span>
                  </button>
                ) : (
                  <button
                    key="month"
                    type="button"
                    aria-label={`${props.localeText.chooseMonthLabel}: ${monthName}`}
                    aria-expanded={viewMode === "month"}
                    data-active={viewMode === "month"}
                    onClick={() => togglePeriodView("month")}
                  >
                    {monthName}
                    <span aria-hidden="true">⌄</span>
                  </button>
                ),
              )}
            </span>
          </h2>
          {viewMode === "year" ? (
            <span className="dtrp-year-page-label">
              {getYearLabel(props.locale, yearPageStart)}–
              {getYearLabel(props.locale, yearPageStart + 11)}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={nextNavigationLabel}
          data-testid={getTestId(
            viewMode === "day" ? props.testIds?.nextMonth : undefined,
            viewMode === "day" ? "dtrp-next-month" : "dtrp-next-period",
          )}
          onClick={() => changeNavigationPage(1)}
        >
          ›
        </button>
      </div>
      {viewMode === "day" ? (
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
      ) : viewMode === "month" ? (
        <CalendarPeriodGrid
          key={`month-${displayed.year}`}
          label={props.localeText.monthGridLabel}
          options={monthOptions}
          columns={3}
          onSelect={selectMonth}
          onChangePage={changePeriodPage}
          onExit={() => setViewMode("day")}
        />
      ) : (
        <CalendarPeriodGrid
          key={`year-${yearPageStart}`}
          label={props.localeText.yearGridLabel}
          options={yearOptions}
          columns={3}
          onSelect={selectYear}
          onChangePage={(offset) =>
            setYearPageStart((current) => current + offset * 12)
          }
          onExit={() => setViewMode("day")}
        />
      )}
    </section>
  );
}
