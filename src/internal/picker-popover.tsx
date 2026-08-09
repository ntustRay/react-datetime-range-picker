import type { RefObject } from "react";

import { CalendarView } from "./calendar-view.js";
import { isUnitVisible } from "./precision.js";
import { getValidationMessage } from "./locale-text.js";
import type { PickerConfiguration } from "./picker-configuration.js";
import { getTestId } from "./test-id.js";
import { TimeColumnPicker } from "./time-column-picker.js";
import { validateTimezone } from "./timezone.js";
import { validateDateTimeRange } from "./validate-date-time-range.js";
import type { DateTimeRangeDraftTarget } from "./date-time-range-draft.js";
import type { DateTimeRangeDraftController } from "./use-date-time-range-draft.js";
import type { DateTimeRangeValidationError } from "../types.js";

interface PickerPopoverDialog {
  id: string;
  label: string;
  ref: RefObject<HTMLDivElement | null>;
}

interface PickerPopoverProps {
  configuration: PickerConfiguration;
  draft: DateTimeRangeDraftController;
  activeTarget: DateTimeRangeDraftTarget;
  dialog: PickerPopoverDialog;
  onReset: () => void;
  onCancel: () => void;
  onNext: () => void;
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
  const validationMessage = (item: DateTimeRangeValidationError): string =>
    getValidationMessage(configuration.localeText, item.code);
  const startHasBlockingError = props.draft.validation.errors.some(
    (error) =>
      error.target === "start" ||
      error.target === "range" ||
      error.target === "timezone",
  );
  const canContinue =
    props.draft.value.startTimestamp !== null && !startHasBlockingError;
  const timeEnabled = isUnitVisible("hour", configuration.precision);

  return (
    <div
      ref={props.dialog.ref}
      id={props.dialog.id}
      className="dtrp-popover"
      role="dialog"
      aria-label={props.dialog.label}
      tabIndex={-1}
      data-target={props.activeTarget}
      data-calendar-enabled={configuration.calendarEnabled}
      data-time-enabled={timeEnabled}
      data-testid={getTestId(configuration.testIds.popover, "dtrp-popover")}
    >
      <div className="dtrp-picker-body">
        {configuration.calendarEnabled ? (
          <CalendarView
            value={props.draft.value}
            target={props.activeTarget}
            timezone={configuration.timezone}
            locale={configuration.locale}
            firstWeekday={configuration.firstWeekday}
            constraints={configuration.constraints}
            localeText={configuration.localeText}
            testIds={configuration.testIds}
            onSelect={(timestamp) =>
              props.draft.changeDate(props.activeTarget, timestamp)
            }
          />
        ) : null}
        {timeEnabled ? (
          <div className="dtrp-picker-controls">
            <TimeColumnPicker
              draft={props.draft}
              target={props.activeTarget}
              timezone={configuration.timezone}
              precision={configuration.precision}
              hourCycle={configuration.hourCycle}
              steps={configuration.steps}
              localeText={configuration.localeText}
              testIds={configuration.testIds}
            />
          </div>
        ) : null}
      </div>
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
      <div className="dtrp-footer">
        {configuration.clearable ? (
          <button
            className="dtrp-reset"
            type="button"
            data-testid={getTestId(
              configuration.testIds.reset ?? configuration.testIds.clear,
              "dtrp-reset",
            )}
            onClick={props.onReset}
          >
            {configuration.localeText.resetButtonLabel}
          </button>
        ) : (
          <span />
        )}
        <output
          className="dtrp-range-summary"
          aria-label={configuration.localeText.rangeSummaryLabel}
          data-testid={getTestId(
            configuration.testIds.rangeSummary,
            "dtrp-range-summary",
          )}
        >
          <span>{props.draft.start.text || "—"}</span>
          <span>~ {props.draft.end.text || "—"}</span>
        </output>
        <label className="dtrp-footer-field">
          <span className="dtrp-visually-hidden">
            {configuration.localeText.hourCycleLabel}
          </span>
          <select
            value={configuration.hourCycle}
            disabled={!isUnitVisible("hour", configuration.precision)}
            data-testid={getTestId(
              configuration.testIds.hourCycle,
              "dtrp-hour-cycle",
            )}
            onChange={(event) =>
              configuration.onHourCycleChange?.(
                event.currentTarget.value === "h12" ? "h12" : "h24",
              )
            }
          >
            <option value="h12">
              {configuration.localeText.hourCycle12Label}
            </option>
            <option value="h24">
              {configuration.localeText.hourCycle24Label}
            </option>
          </select>
        </label>
        {configuration.timezoneSelectorEnabled ? (
          <label className="dtrp-footer-field">
            <span className="dtrp-visually-hidden">
              {configuration.localeText.timezoneLabel}
            </span>
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
        {props.activeTarget === "start" ? (
          <button
            className="dtrp-primary-action"
            type="button"
            data-testid={getTestId(configuration.testIds.next, "dtrp-next")}
            disabled={!canContinue}
            onClick={props.onNext}
          >
            {configuration.localeText.nextButtonLabel}
          </button>
        ) : (
          <button
            className="dtrp-primary-action"
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
        )}
      </div>
    </div>
  );
}
