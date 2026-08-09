import type { RefObject } from "react";

import { CalendarView } from "./calendar-view.js";
import { DateTimeFields } from "./date-time-fields.js";
import { getTestId } from "./test-id.js";
import { validateTimezone } from "./timezone.js";
import { getValidationMessage } from "./locale-text.js";
import type { DateTimeRangeDraftController } from "./use-date-time-range-draft.js";
import type {
  DateTimeRangePickerProps,
  DateTimeRangeLocaleText,
  DateTimeRangeValidationError,
  Precision,
} from "../types.js";
import { validateDateTimeRange } from "../validate-date-time-range.js";

const EMPTY_RANGE = { startTimestamp: null, endTimestamp: null };
const DEFAULT_CONSTRAINTS = {
  minTimestamp: null,
  maxTimestamp: null,
  maxDurationMilliseconds: null,
};

interface PickerPopoverProps {
  pickerProps: DateTimeRangePickerProps;
  localeText: DateTimeRangeLocaleText;
  draft: DateTimeRangeDraftController;
  timezone: string;
  precision: Precision;
  calendarEnabled: boolean;
  textInputEnabled: boolean;
  dialogId: string;
  triggerLabel: string;
  dialogRef: RefObject<HTMLDivElement | null>;
  onCancel: () => void;
  onApply: () => void;
}

export function PickerPopover(props: PickerPopoverProps): React.JSX.Element {
  const timezoneOptions = props.pickerProps.timezoneOptions ?? [props.timezone];
  const invalidTimezoneOptions = timezoneOptions.filter((option) => {
    try {
      validateTimezone(option);
      return false;
    } catch {
      return true;
    }
  });
  const validationDescriptionIds = (
    target: DateTimeRangeValidationError["target"],
  ): string =>
    props.draft.validation.errors
      .filter((item) => item.target === target)
      .map((item) => `dtrp-${item.target}-${item.code}-error`)
      .join(" ");
  const validationMessage = (item: DateTimeRangeValidationError): string => {
    return getValidationMessage(props.localeText, item.code);
  };

  return (
    <div
      ref={props.dialogRef}
      id={props.dialogId}
      className="dtrp-popover"
      role="dialog"
      aria-label={props.triggerLabel}
      tabIndex={-1}
      data-testid={getTestId(props.pickerProps.testIds?.popover, "dtrp-popover")}
    >
      {props.calendarEnabled ? (
        <CalendarView
          value={props.draft.value}
          timezone={props.timezone}
          locale={props.pickerProps.locale ?? "en"}
          firstWeekday={props.pickerProps.firstWeekday}
          constraints={props.pickerProps.constraints ?? DEFAULT_CONSTRAINTS}
          localeText={props.localeText}
          testIds={props.pickerProps.testIds}
          onChange={props.draft.replaceValue}
        />
      ) : null}
      {props.textInputEnabled ? (
        <DateTimeFields
          draft={props.draft}
          precision={props.precision}
          steps={props.pickerProps.steps}
          localeText={props.localeText}
          testIds={props.pickerProps.testIds}
          startDescriptionIds={
            `dtrp-start-format ${validationDescriptionIds("start")}`.trim()
          }
          endDescriptionIds={
            `dtrp-end-format ${validationDescriptionIds("end")}`.trim()
          }
        />
      ) : null}
      {props.pickerProps.features?.timezoneSelector !== false ? (
        <label className="dtrp-field dtrp-timezone-field">
          {props.localeText.timezoneLabel}
          <select
            data-testid={getTestId(
              props.pickerProps.testIds?.timezone,
              "dtrp-timezone",
            )}
            value={props.timezone}
            aria-invalid={invalidTimezoneOptions.includes(props.timezone)}
            onChange={(event) => {
              const nextTimezone = event.currentTarget.value;
              try {
                validateTimezone(nextTimezone);
                props.pickerProps.onTimezoneChange?.(nextTimezone);
              } catch {
                return;
              }
            }}
          >
            {timezoneOptions.map((option) => (
              <option
                key={option}
                value={option}
                disabled={invalidTimezoneOptions.includes(option)}
              >
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {props.draft.validation.errors.length > 0 ? (
        <ul
          className="dtrp-validation"
          aria-live="polite"
          data-testid={getTestId(
            props.pickerProps.testIds?.validation,
            "dtrp-validation",
          )}
        >
          {props.draft.validation.errors.map((item) => (
            <li
              key={`${item.code}-${item.target}`}
              id={`dtrp-${item.target}-${item.code}-error`}
            >
              {validationMessage(item)}
            </li>
          ))}
        </ul>
      ) : null}
      {props.pickerProps.presets !== undefined &&
      props.pickerProps.presets.length > 0 ? (
        <div
          className="dtrp-presets"
          data-testid={props.pickerProps.testIds?.presets ?? "dtrp-presets"}
        >
          {props.pickerProps.presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={getTestId(
                props.pickerProps.testIds?.preset?.(preset.id),
                `dtrp-preset-${preset.id}`,
              )}
              onClick={() => {
                const presetValue = preset.getValue({
                  nowTimestamp: Date.now(),
                  timezone: props.timezone,
                  precision: props.precision,
                });
                const presetValidation = validateDateTimeRange(presetValue, {
                  ...(props.pickerProps.constraints === undefined
                    ? {}
                    : { constraints: props.pickerProps.constraints }),
                  ...(props.pickerProps.steps === undefined
                    ? {}
                    : { steps: props.pickerProps.steps }),
                  timezone: props.timezone,
                });
                if (presetValidation.status === "complete") {
                  props.draft.replaceValue(presetValue);
                }
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="dtrp-actions">
        {props.pickerProps.clearable !== false ? (
          <button
            className="dtrp-clear"
            type="button"
            data-testid={getTestId(
              props.pickerProps.testIds?.clear,
              "dtrp-clear",
            )}
            onClick={() => props.draft.replaceValue(EMPTY_RANGE)}
          >
            {props.localeText.clearButtonLabel}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          data-testid={getTestId(
            props.pickerProps.testIds?.cancel,
            "dtrp-cancel",
          )}
          onClick={props.onCancel}
        >
          {props.localeText.cancelButtonLabel}
        </button>
        <button
          className="dtrp-apply"
          type="button"
          data-testid={getTestId(
            props.pickerProps.testIds?.apply,
            "dtrp-apply",
          )}
          disabled={props.draft.validation.status !== "complete"}
          onClick={props.onApply}
        >
          {props.localeText.applyButtonLabel}
        </button>
      </div>
    </div>
  );
}
