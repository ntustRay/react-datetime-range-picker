import { isCalendarDayDisabled, type CalendarMonth } from "./calendar.js";
import type { DateTimeRangeConstraints, Timestamp } from "../types.js";

interface CalendarSelection {
  constraints: DateTimeRangeConstraints;
  target: "start" | "end";
  startDay: Timestamp | null;
  endDay: Timestamp | null;
  today: Timestamp;
}

interface CalendarFocus {
  active: boolean;
  index: number;
  onFocus: (index: number) => void;
  onMove: (index: number) => void;
  onChangeMonth: (offset: number) => void;
}

interface CalendarPresentation {
  calendar: CalendarMonth;
  label: string;
  weekdayLabels: readonly string[];
  locale: string;
  timezone: string;
  calendarTestId: string | null;
  dateTestId: ((timestamp: Timestamp) => string) | null;
  startDateStatusLabel: string;
  endDateStatusLabel: string;
  inRangeStatusLabel: string;
}

interface CalendarMonthGridProps {
  presentation: CalendarPresentation;
  selection: CalendarSelection;
  focus: CalendarFocus;
  onSelect: (timestamp: Timestamp) => void;
}

function handleNavigation(
  event: React.KeyboardEvent<HTMLButtonElement>,
  index: number,
  columnIndex: number,
  focus: CalendarFocus,
): void {
  if (event.key === "ArrowLeft") focus.onMove(index - 1);
  else if (event.key === "ArrowRight") focus.onMove(index + 1);
  else if (event.key === "ArrowUp") focus.onMove(index - 7);
  else if (event.key === "ArrowDown") focus.onMove(index + 7);
  else if (event.key === "Home") focus.onMove(index - columnIndex);
  else if (event.key === "End") focus.onMove(index + 6 - columnIndex);
  else if (event.key === "PageUp") focus.onChangeMonth(-1);
  else if (event.key === "PageDown") focus.onChangeMonth(1);
  else return;
  event.preventDefault();
}

export function CalendarMonthGrid(
  props: CalendarMonthGridProps,
): React.JSX.Element {
  return (
    <div
      role="grid"
      aria-label={props.presentation.label}
      data-calendar-grid="current"
      data-testid={props.presentation.calendarTestId ?? undefined}
    >
      <div role="row">
        {props.presentation.weekdayLabels.map((label) => (
          <span key={label} role="columnheader">
            {label}
          </span>
        ))}
      </div>
      {Array.from({ length: 6 }, (_, rowIndex) => (
        <div key={rowIndex} role="row">
          {props.presentation.calendar.days
            .slice(rowIndex * 7, rowIndex * 7 + 7)
            .map((day, columnIndex) => {
              const index = rowIndex * 7 + columnIndex;
              const disabled = isCalendarDayDisabled(
                day.timestamp,
                props.selection.target,
                props.selection.startDay,
                props.selection.endDay,
                props.selection.constraints,
              );
              const selectedStart = day.timestamp === props.selection.startDay;
              const selectedEnd = day.timestamp === props.selection.endDay;
              const inRange =
                day.timestamp !== null &&
                props.selection.startDay !== null &&
                props.selection.endDay !== null &&
                day.timestamp > props.selection.startDay &&
                day.timestamp < props.selection.endDay;
              const label = new Intl.DateTimeFormat(props.presentation.locale, {
                dateStyle: "full",
                timeZone: props.presentation.timezone,
              }).format(day.timestamp ?? 0);
              const dateTestId =
                day.timestamp === null || props.presentation.dateTestId === null
                  ? undefined
                  : props.presentation.dateTestId(day.timestamp);

              return (
                <button
                  key={`${day.year}-${day.month}-${day.day}`}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-selected={selectedStart || selectedEnd}
                  aria-current={
                    day.timestamp === props.selection.today ? "date" : undefined
                  }
                  disabled={disabled}
                  tabIndex={
                    props.focus.active && index === props.focus.index ? 0 : -1
                  }
                  data-calendar-index={index}
                  data-current-month={day.currentMonth}
                  data-in-range={inRange}
                  data-range-complete={
                    props.selection.startDay !== null &&
                    props.selection.endDay !== null
                  }
                  data-range-start={selectedStart}
                  data-range-end={selectedEnd}
                  data-testid={dateTestId}
                  onFocus={() => props.focus.onFocus(index)}
                  onKeyDown={(event) =>
                    handleNavigation(event, index, columnIndex, props.focus)
                  }
                  onClick={() => {
                    if (day.timestamp === null) return;
                    props.onSelect(day.timestamp);
                  }}
                >
                  <span className="dtrp-day-value">{day.day}</span>
                  {selectedStart ? (
                    <span className="dtrp-visually-hidden">
                      {props.presentation.startDateStatusLabel}
                    </span>
                  ) : null}
                  {selectedEnd ? (
                    <span className="dtrp-visually-hidden">
                      {props.presentation.endDateStatusLabel}
                    </span>
                  ) : null}
                  {inRange ? (
                    <span className="dtrp-visually-hidden">
                      {props.presentation.inRangeStatusLabel}
                    </span>
                  ) : null}
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}
