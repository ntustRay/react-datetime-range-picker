import type { RefObject } from "react";

import { CalendarView } from "./calendar-view.js";
import { DateTimeFields } from "./date-time-fields.js";
import { getTestId } from "./test-id.js";
import { validateTimezone } from "./timezone.js";
import { getValidationMessage } from "./locale-text.js";
import type { PickerConfiguration } from "./picker-configuration.js";
import { validateDateTimeRange } from "./validate-date-time-range.js";
import type { DateTimeRangeDraftController } from "./use-date-time-range-draft.js";
import type { DateTimeRangeValidationError } from "../types.js";

const EMPTY_RANGE = { startTimestamp: null, endTimestamp: null };

interface PickerPopoverDialog {
  id: string;
  label: string;
  ref: RefObject<HTMLDivElement | null>;
}

interface PickerPopoverProps {
  configuration: PickerConfiguration;
  draft: DateTimeRangeDraftController;
  dialog: PickerPopoverDialog;
  onCancel: () => void;
  onApply: () => void;
}

export function PickerPopover(props: PickerPopoverProps): React.JSX.Element {
  const { configuration } = props;
  const invalidTimezoneOptions = configuration.timezoneOptions.filter(
    (option) => {
      try {
        validateTimezone(option);
        return false;
      } catch {
        return true;
      }
    },
  );
  const validationDescriptionIds = (
    target: DateTimeRangeValidationError["target"],
  ): string =>
    props.draft.validation.errors
      .filter((item) => item.target === target)
      .map((item) => `dtrp-${item.target}-${item.code}-error`)
      .join(" ");
  const validationMessage = (item: DateTimeRangeValidationError): string => {
    return getValidationMessage(configuration.localeText, item.code);
  };

  return (
    <div
      ref={props.dialog.ref}
      id={props.dialog.id}
      className="dtrp-popover"
      role="dialog"
      aria-label={props.dialog.label}
      tabIndex={-1}
      data-testid={getTestId(configuration.testIds.popover, "dtrp-popover")}
    >
      {configuration.calendarEnabled ? (
        <CalendarView
          value={props.draft.value}
          timezone={configuration.timezone}
          locale={configuration.locale}
          firstWeekday={configuration.firstWeekday}
          constraints={configuration.constraints}
          localeText={configuration.localeText}
          testIds={configuration.testIds}
          onChange={props.draft.replaceValue}
        />
      ) : null}
      {configuration.textInputEnabled ? (
        <DateTimeFields
          draft={props.draft}
          precision={configuration.precision}
          steps={configuration.steps}
          localeText={configuration.localeText}
          testIds={configuration.testIds}
          startDescriptionIds={
            `dtrp-start-format ${validationDescriptionIds("start")}`.trim()
          }
          endDescriptionIds={
            `dtrp-end-format ${validationDescriptionIds("end")}`.trim()
          }
        />
      ) : null}
      {configuration.timezoneSelectorEnabled ? (
        <label className="dtrp-field dtrp-timezone-field">
          {configuration.localeText.timezoneLabel}
          <select
            data-testid={getTestId(
              configuration.testIds.timezone,
              "dtrp-timezone",
            )}
            value={configuration.timezone}
            aria-invalid={invalidTimezoneOptions.includes(
              configuration.timezone,
            )}
            onChange={(event) => {
              const nextTimezone = event.currentTarget.value;
              try {
                validateTimezone(nextTimezone);
                configuration.onTimezoneChange?.(nextTimezone);
              } catch {
                return;
              }
            }}
          >
            {configuration.timezoneOptions.map((option) => (
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
            configuration.testIds.validation,
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
      {configuration.presets.length > 0 ? (
        <div
          className="dtrp-presets"
          data-testid={configuration.testIds.presets ?? "dtrp-presets"}
        >
          {configuration.presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={getTestId(
                configuration.testIds.preset?.(preset.id),
                `dtrp-preset-${preset.id}`,
              )}
              onClick={() => {
                const presetValue = preset.getValue({
                  nowTimestamp: Date.now(),
                  timezone: configuration.timezone,
                  precision: configuration.precision,
                });
                const presetValidation = validateDateTimeRange(presetValue, {
                  constraints: configuration.constraints,
                  steps: configuration.steps,
                  timezone: configuration.timezone,
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
        {configuration.clearable ? (
          <button
            className="dtrp-clear"
            type="button"
            data-testid={getTestId(
              configuration.testIds.clear,
              "dtrp-clear",
            )}
            onClick={() => props.draft.replaceValue(EMPTY_RANGE)}
          >
            {configuration.localeText.clearButtonLabel}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          data-testid={getTestId(
            configuration.testIds.cancel,
            "dtrp-cancel",
          )}
          onClick={props.onCancel}
        >
          {configuration.localeText.cancelButtonLabel}
        </button>
        <button
          className="dtrp-apply"
          type="button"
          data-testid={getTestId(
            configuration.testIds.apply,
            "dtrp-apply",
          )}
          disabled={props.draft.validation.status !== "complete"}
          onClick={props.onApply}
        >
          {configuration.localeText.applyButtonLabel}
        </button>
      </div>
    </div>
  );
}
