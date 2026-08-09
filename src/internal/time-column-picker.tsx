import { useEffect, useRef } from "react";

import { isUnitVisible } from "./precision.js";
import { getTestId } from "./test-id.js";
import {
  formatTimezoneOffset,
  getLocalDateTime,
} from "./timezone.js";
import type { DateTimeRangeDraftTarget } from "./date-time-range-draft.js";
import type { DateTimeRangeDraftController } from "./use-date-time-range-draft.js";
import type {
  DateTimeRangeLocaleText,
  DateTimeRangeSteps,
  DateTimeRangeTestIds,
  HourCycle,
  Precision,
} from "../types.js";

const ITEM_HEIGHT_PIXELS = 36;

interface TimeColumnOption {
  value: number;
  label: string;
}

interface TimeColumnProps {
  label: string;
  options: readonly TimeColumnOption[];
  value: number;
  disabled: boolean;
  testId: string;
  onChange: (value: number) => void;
}

interface TimeColumnPickerProps {
  draft: DateTimeRangeDraftController;
  target: DateTimeRangeDraftTarget;
  timezone: string;
  precision: Precision;
  hourCycle: HourCycle;
  steps: DateTimeRangeSteps;
  localeText: DateTimeRangeLocaleText;
  testIds: Partial<DateTimeRangeTestIds>;
}

function createNumericOptions(
  limit: number,
  step: number,
  length: number,
  start = 0,
): TimeColumnOption[] {
  const options: TimeColumnOption[] = [];
  for (let value = start; value < limit; value += step) {
    options.push({
      value,
      label: String(value).padStart(length, "0"),
    });
  }
  return options;
}

function TimeColumn(props: TimeColumnProps): React.JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(
    0,
    props.options.findIndex((option) => option.value === props.value),
  );

  useEffect(() => {
    const list = listRef.current;
    if (list === null) return;
    const scrollTop = selectedIndex * ITEM_HEIGHT_PIXELS;
    if (typeof list.scrollTo === "function") {
      list.scrollTo({ top: scrollTop, behavior: "instant" });
    } else {
      list.scrollTop = scrollTop;
    }
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const selectIndex = (index: number): void => {
    const option = props.options[index];
    if (option !== undefined && option.value !== props.value) {
      props.onChange(option.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    let nextIndex = selectedIndex;
    if (event.key === "ArrowUp") nextIndex -= 1;
    else if (event.key === "ArrowDown") nextIndex += 1;
    else if (event.key === "PageUp") nextIndex -= 6;
    else if (event.key === "PageDown") nextIndex += 6;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = props.options.length - 1;
    else return;
    event.preventDefault();
    selectIndex(Math.max(0, Math.min(props.options.length - 1, nextIndex)));
  };

  return (
    <div className="dtrp-time-column">
      <span className="dtrp-time-column-label">{props.label}</span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={props.label}
        aria-disabled={props.disabled}
        tabIndex={props.disabled ? -1 : 0}
        className="dtrp-time-column-list"
        data-testid={props.testId}
        onKeyDown={handleKeyDown}
        onScroll={(event) => {
          if (props.disabled) return;
          if (scrollTimerRef.current !== null) {
            clearTimeout(scrollTimerRef.current);
          }
          const scrollTop = event.currentTarget.scrollTop;
          scrollTimerRef.current = setTimeout(() => {
            selectIndex(
              Math.max(
                0,
                Math.min(
                  props.options.length - 1,
                  Math.round(scrollTop / ITEM_HEIGHT_PIXELS),
                ),
              ),
            );
          }, 100);
        }}
      >
        {props.options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === props.value}
            tabIndex={-1}
            disabled={props.disabled}
            onClick={() => props.onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TimeColumnPicker(
  props: TimeColumnPickerProps,
): React.JSX.Element | null {
  if (!isUnitVisible("hour", props.precision)) return null;
  const timestamp =
    props.target === "start"
      ? props.draft.value.startTimestamp
      : props.draft.value.endTimestamp;
  const local =
    timestamp === null ? null : getLocalDateTime(timestamp, props.timezone);
  const hour = local?.hour ?? 0;
  const hourValue = props.hourCycle === "h12" ? hour % 12 || 12 : hour;
  const isPm = hour >= 12;
  const field = props.draft[props.target];

  return (
    <section
      className="dtrp-time-columns"
      data-testid={getTestId(
        props.target === "start"
          ? props.testIds.startTime
          : props.testIds.endTime,
        `dtrp-${props.target}-time`,
      )}
    >
      <div className="dtrp-time-column-grid">
        <TimeColumn
          label={props.localeText.hourColumnLabel}
          options={createNumericOptions(
            props.hourCycle === "h12" ? 13 : 24,
            1,
            2,
            props.hourCycle === "h12" ? 1 : 0,
          )}
          value={hourValue}
          disabled={local === null}
          testId={getTestId(props.testIds.hourColumn, "dtrp-hour-column")}
          onChange={(value) => {
            const nextHour =
              props.hourCycle === "h12"
                ? value % 12 + (isPm ? 12 : 0)
                : value;
            props.draft.changeTimeUnit(props.target, "hour", nextHour);
          }}
        />
        {isUnitVisible("minute", props.precision) ? (
          <TimeColumn
            label={props.localeText.minuteColumnLabel}
            options={createNumericOptions(60, props.steps.minute, 2)}
            value={local?.minute ?? 0}
            disabled={local === null}
            testId={getTestId(props.testIds.minuteColumn, "dtrp-minute-column")}
            onChange={(value) =>
              props.draft.changeTimeUnit(props.target, "minute", value)
            }
          />
        ) : null}
        {isUnitVisible("second", props.precision) ? (
          <TimeColumn
            label={props.localeText.secondColumnLabel}
            options={createNumericOptions(60, props.steps.second, 2)}
            value={local?.second ?? 0}
            disabled={local === null}
            testId={getTestId(props.testIds.secondColumn, "dtrp-second-column")}
            onChange={(value) =>
              props.draft.changeTimeUnit(props.target, "second", value)
            }
          />
        ) : null}
        {isUnitVisible("millisecond", props.precision) ? (
          <TimeColumn
            label={props.localeText.millisecondColumnLabel}
            options={createNumericOptions(1_000, props.steps.millisecond, 3)}
            value={local?.millisecond ?? 0}
            disabled={local === null}
            testId={getTestId(
              props.testIds.millisecondColumn,
              "dtrp-millisecond-column",
            )}
            onChange={(value) =>
              props.draft.changeTimeUnit(props.target, "millisecond", value)
            }
          />
        ) : null}
        {props.hourCycle === "h12" ? (
          <TimeColumn
            label={props.localeText.periodColumnLabel}
            options={[
              { value: 0, label: props.localeText.amLabel },
              { value: 1, label: props.localeText.pmLabel },
            ]}
            value={isPm ? 1 : 0}
            disabled={local === null}
            testId={getTestId(props.testIds.periodColumn, "dtrp-period-column")}
            onChange={(value) =>
              props.draft.changePeriod(
                props.target,
                value === 0 ? "am" : "pm",
              )
            }
          />
        ) : null}
      </div>
      {field.ambiguousCandidates.length > 0 ? (
        <label className="dtrp-field dtrp-offset-field">
          {props.target === "start"
            ? props.localeText.startOffsetLabel
            : props.localeText.endOffsetLabel}
          <select
            value=""
            onChange={(event) =>
              props.draft.chooseOffset(
                props.target,
                Number(event.currentTarget.value),
              )
            }
          >
            <option value="">{props.localeText.chooseOffsetLabel}</option>
            {field.ambiguousCandidates.map((candidate, index) => (
              <option key={candidate.timestamp} value={index}>
                {index === 0
                  ? props.localeText.earlierOffsetLabel
                  : props.localeText.laterOffsetLabel}{" "}
                ({formatTimezoneOffset(candidate.offsetMinutes)})
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </section>
  );
}
