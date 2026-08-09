import { useEffect, useRef, useState } from "react";

import {
  formatEditableTimestamp,
  formatDisplayTimestamp,
  getEditableDateTimeFormat,
  parseEditableDateTime,
} from "./internal/date-time-text.js";
import {
  formatTimezoneOffset,
  getLocalDateTime,
  validateTimezone,
  type LocalDateTimeCandidate,
} from "./internal/timezone.js";
import { isUnitVisible } from "./internal/precision.js";
import { CalendarView } from "./internal/calendar-view.js";
import type {
  DateTimeRangePickerProps,
  DateTimeRangeValidationError,
  DateTimeRangeValidationErrorCode,
  DateTimeRangeValidationResult,
  DateTimeRangeValue,
  Precision,
} from "./types.js";
import { validateDateTimeRange } from "./validate-date-time-range.js";

const DEFAULT_TRIGGER_LABEL = "Select date and time range";
const EMPTY_RANGE = { startTimestamp: null, endTimestamp: null };
const DEFAULT_CONSTRAINTS = {
  minTimestamp: null,
  maxTimestamp: null,
  maxDurationMilliseconds: null,
};

function testId(value: string | undefined, fallback: string): string {
  return value?.trim() === "" || value === undefined ? fallback : value;
}

function getDefaultValidationMessage(code: DateTimeRangeValidationErrorCode): string {
  const messages: Record<DateTimeRangeValidationErrorCode, string> = {
    "end-without-start": "Choose a start before the end.",
    "end-not-after-start": "End must be after start.",
    "before-minimum": "The value is before the minimum.",
    "after-maximum": "The value is after the maximum.",
    "maximum-duration-exceeded": "The range is longer than allowed.",
    "minute-step-mismatch": "The minute does not match the required step.",
    "second-step-mismatch": "The second does not match the required step.",
    "millisecond-step-mismatch": "The millisecond does not match the required step.",
    required: "A date-time range is required.",
    "invalid-text": "Enter a valid date and time.",
    "invalid-timezone": "Choose a valid IANA timezone.",
    "nonexistent-local-time": "This local time does not exist.",
    "ambiguous-local-time": "Choose an offset for this repeated local time.",
  };
  return messages[code];
}

function safelyFormatTimestamp(
  timestamp: number | null,
  timezone: string,
  precision: Precision,
): string {
  if (timestamp === null) return "";
  try {
    return formatEditableTimestamp(timestamp, timezone, precision);
  } catch {
    return String(timestamp);
  }
}

function formatTimeInput(
  timestamp: number | null,
  timezone: string,
  precision: Precision,
): string {
  if (timestamp === null || !isUnitVisible("hour", precision)) return "";
  const local = getLocalDateTime(timestamp, timezone);
  const pad = (value: number, length = 2): string =>
    String(value).padStart(length, "0");
  let value = `${pad(local.hour)}:${pad(local.minute)}`;
  if (isUnitVisible("second", precision)) value += `:${pad(local.second)}`;
  if (isUnitVisible("millisecond", precision)) {
    value += `.${pad(local.millisecond, 3)}`;
  }
  return value;
}

function timeInputStep(precision: Precision, step: number): string {
  if (precision === "hour") return "3600";
  if (precision === "minute") return String(step * 60);
  if (precision === "second") return String(step);
  if (precision === "millisecond") return String(step / 1_000);
  return "60";
}

export function DateTimeRangePicker(
  props: DateTimeRangePickerProps,
): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(props.value);
  const timezone = props.timezone ?? "UTC";
  const precision = props.precision ?? "second";
  const calendarEnabled = props.features?.calendar !== false;
  const textInputEnabled =
    props.features?.textInput !== false || calendarEnabled === false;
  const [startText, setStartText] = useState(() =>
    safelyFormatTimestamp(props.value.startTimestamp, timezone, precision),
  );
  const [endText, setEndText] = useState(() =>
    safelyFormatTimestamp(props.value.endTimestamp, timezone, precision),
  );
  const [startTextError, setStartTextError] =
    useState<DateTimeRangeValidationErrorCode | null>(null);
  const [endTextError, setEndTextError] =
    useState<DateTimeRangeValidationErrorCode | null>(null);
  const [startAmbiguousCandidates, setStartAmbiguousCandidates] = useState<
    readonly LocalDateTimeCandidate[]
  >([]);
  const [endAmbiguousCandidates, setEndAmbiguousCandidates] = useState<
    readonly LocalDateTimeCandidate[]
  >([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const validationSignatureRef = useRef<string | null>(null);

  const rangeValidation = validateDateTimeRange(draft, {
    ...(props.constraints === undefined ? {} : { constraints: props.constraints }),
    ...(props.steps === undefined ? {} : { steps: props.steps }),
    ...(props.required === undefined ? {} : { required: props.required }),
    ...(props.timezone === undefined ? {} : { timezone: props.timezone }),
  });
  const textErrors: DateTimeRangeValidationError[] = [];
  if (startTextError !== null) {
    textErrors.push({ code: startTextError, target: "start" });
  }
  if (endTextError !== null) {
    textErrors.push({ code: endTextError, target: "end" });
  }
  const validation: DateTimeRangeValidationResult =
    textErrors.length === 0
      ? rangeValidation
      : {
          status: "invalid",
          errors: [...rangeValidation.errors, ...textErrors],
        };
  const validationSignature = JSON.stringify(validation);

  const closeAndDiscard = (): void => {
    setDraft(props.value);
    setStartText(safelyFormatTimestamp(props.value.startTimestamp, timezone, precision));
    setEndText(safelyFormatTimestamp(props.value.endTimestamp, timezone, precision));
    setStartTextError(null);
    setEndTextError(null);
    setStartAmbiguousCandidates([]);
    setEndAmbiguousCandidates([]);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setDraft(props.value);
    setStartText(safelyFormatTimestamp(props.value.startTimestamp, timezone, precision));
    setEndText(safelyFormatTimestamp(props.value.endTimestamp, timezone, precision));
    setStartTextError(null);
    setEndTextError(null);
    setStartAmbiguousCandidates([]);
    setEndAmbiguousCandidates([]);
  }, [props.value.startTimestamp, props.value.endTimestamp, timezone, precision]);

  useEffect(() => {
    if (
      props.onValidationChange !== undefined &&
      validationSignatureRef.current !== validationSignature
    ) {
      validationSignatureRef.current = validationSignature;
      props.onValidationChange(validation);
    }
  }, [props.onValidationChange, validation, validationSignature]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closeAndDiscard();
    };
    const handlePointerDown = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closeAndDiscard();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, props.value.startTimestamp, props.value.endTimestamp]);

  const triggerLabel = props.labels?.trigger ?? DEFAULT_TRIGGER_LABEL;
  const applyLabel = props.labels?.apply ?? "Apply";
  const cancelLabel = props.labels?.cancel ?? "Cancel";
  const clearLabel = props.labels?.clear ?? "Clear";
  const timezoneOptions = props.timezoneOptions ?? [timezone];
  const invalidTimezoneOptions = timezoneOptions.filter((option) => {
    try {
      validateTimezone(option);
      return false;
    } catch {
      return true;
    }
  });
  const validationMessage = (item: DateTimeRangeValidationError): string => {
    const fallback = getDefaultValidationMessage(item.code);
    return props.formatValidationMessage?.(item, fallback) ?? fallback;
  };
  const validationDescriptionIds = (
    target: DateTimeRangeValidationError["target"],
  ): string =>
    validation.errors
      .filter((item) => item.target === target)
      .map((item) => `dtrp-${item.target}-${item.code}-error`)
      .join(" ");
  const rangeSummary =
    props.value.startTimestamp === null
      ? triggerLabel
      : props.value.endTimestamp === null
        ? `${formatDisplayTimestamp(props.value.startTimestamp, timezone, props.locale ?? "en", precision)} – …`
        : `${formatDisplayTimestamp(props.value.startTimestamp, timezone, props.locale ?? "en", precision)} – ${formatDisplayTimestamp(props.value.endTimestamp, timezone, props.locale ?? "en", precision)}`;

  const updateDraft = (value: typeof draft): void => {
    setDraft(value);
    setStartText(safelyFormatTimestamp(value.startTimestamp, timezone, precision));
    setEndText(safelyFormatTimestamp(value.endTimestamp, timezone, precision));
    props.onChange(value);
  };

  const applyTextValue = (
    target: "start" | "end",
    text: string,
  ): void => {
    const setError = target === "start" ? setStartTextError : setEndTextError;
    if (text === "") {
      setError(null);
      updateDraft({
        startTimestamp: target === "start" ? null : draft.startTimestamp,
        endTimestamp: target === "end" ? null : draft.endTimestamp,
      });
      return;
    }
    const result = parseEditableDateTime(text, timezone, precision);
    if (result.status !== "valid") {
      if (result.status === "ambiguous") {
        const setCandidates =
          target === "start"
            ? setStartAmbiguousCandidates
            : setEndAmbiguousCandidates;
        setCandidates([...result.candidates]);
      }
      setError(
        result.status === "nonexistent"
          ? "nonexistent-local-time"
          : result.status === "ambiguous"
            ? "ambiguous-local-time"
            : "invalid-text",
      );
      return;
    }
    const timestamp = result.candidates[0]?.timestamp;
    if (timestamp === undefined) {
      setError("invalid-text");
      return;
    }
    setError(null);
    if (target === "start") setStartAmbiguousCandidates([]);
    else setEndAmbiguousCandidates([]);
    const value: DateTimeRangeValue = {
      startTimestamp: target === "start" ? timestamp : draft.startTimestamp,
      endTimestamp: target === "end" ? timestamp : draft.endTimestamp,
    };
    updateDraft(value);
  };

  const chooseOffset = (target: "start" | "end", index: number): void => {
    const candidates =
      target === "start" ? startAmbiguousCandidates : endAmbiguousCandidates;
    const candidate = candidates[index];
    if (candidate === undefined) return;
    if (target === "start") {
      setStartAmbiguousCandidates([]);
      setStartTextError(null);
      updateDraft({ startTimestamp: candidate.timestamp, endTimestamp: draft.endTimestamp });
    } else {
      setEndAmbiguousCandidates([]);
      setEndTextError(null);
      updateDraft({ startTimestamp: draft.startTimestamp, endTimestamp: candidate.timestamp });
    }
  };

  const applyTimeValue = (target: "start" | "end", time: string): void => {
    const currentText = target === "start" ? startText : endText;
    const dateText = currentText.split(" ")[0];
    if (dateText === undefined || time === "") return;
    const editableTime =
      precision === "hour"
        ? time.slice(0, 2)
        : precision === "minute"
          ? time.slice(0, 5)
          : precision === "second"
            ? time.slice(0, 8)
            : time;
    const result = parseEditableDateTime(
      `${dateText} ${editableTime}`,
      timezone,
      precision,
    );
    const setError = target === "start" ? setStartTextError : setEndTextError;
    if (result.status !== "valid") {
      setError(
        result.status === "nonexistent"
          ? "nonexistent-local-time"
          : result.status === "ambiguous"
            ? "ambiguous-local-time"
            : "invalid-text",
      );
      return;
    }
    const timestamp = result.candidates[0]?.timestamp;
    if (timestamp === undefined) {
      setError("invalid-text");
      return;
    }
    setError(null);
    updateDraft({
      startTimestamp: target === "start" ? timestamp : draft.startTimestamp,
      endTimestamp: target === "end" ? timestamp : draft.endTimestamp,
    });
  };

  return (
    <div
      ref={rootRef}
      className="dtrp-root"
      data-testid={testId(props.testIds?.root, "dtrp-root")}
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid={testId(props.testIds?.trigger, "dtrp-trigger")}
        disabled={props.disabled === true || props.readOnly === true}
        aria-label={triggerLabel}
        onClick={() => {
          setDraft(props.value);
          setStartText(safelyFormatTimestamp(props.value.startTimestamp, timezone, precision));
          setEndText(safelyFormatTimestamp(props.value.endTimestamp, timezone, precision));
          setStartTextError(null);
          setEndTextError(null);
          setIsOpen(true);
        }}
      >
        {rangeSummary}
      </button>
      {isOpen ? (
        <div
          ref={dialogRef}
          className="dtrp-popover"
          role="dialog"
          aria-label={triggerLabel}
          tabIndex={-1}
          data-testid={testId(props.testIds?.popover, "dtrp-popover")}
        >
          {calendarEnabled ? (
            <CalendarView
              value={draft}
              timezone={timezone}
              locale={props.locale ?? "en"}
              firstWeekday={props.firstWeekday}
              constraints={props.constraints ?? DEFAULT_CONSTRAINTS}
              testIds={props.testIds}
              onChange={updateDraft}
            />
          ) : null}
          {textInputEnabled ? (
            <div>
              <label>
                {props.labels?.start ?? "Start"}
                <input
                  aria-describedby={`dtrp-start-format ${validationDescriptionIds("start")}`.trim()}
                  data-testid={testId(props.testIds?.startInput, "dtrp-start-input")}
                  value={startText}
                  aria-invalid={startTextError === null ? undefined : true}
                  onChange={(event) => {
                    setStartText(event.currentTarget.value);
                    setStartTextError("invalid-text");
                  }}
                  onBlur={() => applyTextValue("start", startText)}
                />
              </label>
              <span id="dtrp-start-format">
                {props.labels?.startFormatHint ?? getEditableDateTimeFormat(precision)}
              </span>
              <label>
                {props.labels?.end ?? "End"}
                <input
                  aria-describedby={`dtrp-end-format ${validationDescriptionIds("end")}`.trim()}
                  data-testid={testId(props.testIds?.endInput, "dtrp-end-input")}
                  value={endText}
                  aria-invalid={endTextError === null ? undefined : true}
                  onChange={(event) => {
                    setEndText(event.currentTarget.value);
                    setEndTextError("invalid-text");
                  }}
                  onBlur={() => applyTextValue("end", endText)}
                />
              </label>
              <span id="dtrp-end-format">
                {props.labels?.endFormatHint ?? getEditableDateTimeFormat(precision)}
              </span>
          {isUnitVisible("hour", precision) ? (
                <div>
                  <label>
                    {props.labels?.start ?? "Start"} time
                    <input
                      type={isUnitVisible("millisecond", precision) ? "text" : "time"}
                      step={timeInputStep(
                        precision,
                        props.steps?.[isUnitVisible("minute", precision)
                          ? "minute"
                          : isUnitVisible("second", precision)
                            ? "second"
                            : "millisecond"] ?? 1,
                      )}
                      data-testid={testId(props.testIds?.startTime, "dtrp-start-time")}
                      value={formatTimeInput(draft.startTimestamp, timezone, precision)}
                      disabled={props.disabled === true || props.readOnly === true}
                      onChange={(event) =>
                        applyTimeValue("start", event.currentTarget.value)
                      }
                    />
                  </label>
                  <label>
                    {props.labels?.end ?? "End"} time
                    <input
                      type={isUnitVisible("millisecond", precision) ? "text" : "time"}
                      step={timeInputStep(
                        precision,
                        props.steps?.[isUnitVisible("minute", precision)
                          ? "minute"
                          : isUnitVisible("second", precision)
                            ? "second"
                            : "millisecond"] ?? 1,
                      )}
                      data-testid={testId(props.testIds?.endTime, "dtrp-end-time")}
                      value={formatTimeInput(draft.endTimestamp, timezone, precision)}
                      disabled={props.disabled === true || props.readOnly === true}
                      onChange={(event) =>
                        applyTimeValue("end", event.currentTarget.value)
                      }
                    />
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}
          {startAmbiguousCandidates.length > 0 ? (
            <label>
              {props.labels?.start ?? "Start"} offset
              <select
                aria-label={`${props.labels?.start ?? "Start"} offset`}
                value=""
                onChange={(event) => chooseOffset("start", Number(event.currentTarget.value))}
              >
                <option value="">{props.labels?.earlierOffset ?? "Choose an offset"}</option>
                {startAmbiguousCandidates.map((candidate, index) => (
                  <option key={candidate.timestamp} value={index}>
                    {index === 0
                      ? props.labels?.earlierOffset ?? "Earlier"
                      : props.labels?.laterOffset ?? "Later"}{" "}
                    ({formatTimezoneOffset(candidate.offsetMinutes)})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {endAmbiguousCandidates.length > 0 ? (
            <label>
              {props.labels?.end ?? "End"} offset
              <select
                aria-label={`${props.labels?.end ?? "End"} offset`}
                value=""
                onChange={(event) => chooseOffset("end", Number(event.currentTarget.value))}
              >
                <option value="">{props.labels?.earlierOffset ?? "Choose an offset"}</option>
                {endAmbiguousCandidates.map((candidate, index) => (
                  <option key={candidate.timestamp} value={index}>
                    {index === 0
                      ? props.labels?.earlierOffset ?? "Earlier"
                      : props.labels?.laterOffset ?? "Later"}{" "}
                    ({formatTimezoneOffset(candidate.offsetMinutes)})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {props.features?.timezoneSelector !== false ? (
            <label>
              {props.labels?.timezone ?? "Time zone"}
              <select
                data-testid={testId(props.testIds?.timezone, "dtrp-timezone")}
                value={timezone}
                aria-invalid={invalidTimezoneOptions.includes(timezone)}
                onChange={(event) => {
                  const nextTimezone = event.currentTarget.value;
                  try {
                    validateTimezone(nextTimezone);
                    props.onTimezoneChange?.(nextTimezone);
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
          {validation.errors.length > 0 ? (
            <ul
              aria-live="polite"
              data-testid={testId(props.testIds?.validation, "dtrp-validation")}
            >
              {validation.errors.map((item) => (
                <li
                  key={`${item.code}-${item.target}`}
                  id={`dtrp-${item.target}-${item.code}-error`}
                >
                  {validationMessage(item)}
                </li>
              ))}
            </ul>
          ) : null}
          {props.presets !== undefined && props.presets.length > 0 ? (
            <div data-testid={props.testIds?.presets ?? "dtrp-presets"}>
              {props.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={
                    testId(
                      props.testIds?.preset?.(preset.id),
                      `dtrp-preset-${preset.id}`,
                    )
                  }
                  onClick={() => {
                    const presetValue = preset.getValue({
                      nowTimestamp: Date.now(),
                      timezone: props.timezone ?? "UTC",
                      precision: props.precision ?? "second",
                    });
                    const presetValidation = validateDateTimeRange(presetValue, {
                      ...(props.constraints === undefined
                        ? {}
                        : { constraints: props.constraints }),
                      ...(props.steps === undefined ? {} : { steps: props.steps }),
                      ...(props.timezone === undefined ? {} : { timezone: props.timezone }),
                    });
                    if (presetValidation.status === "complete") {
                      updateDraft(presetValue);
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            data-testid={testId(props.testIds?.apply, "dtrp-apply")}
            disabled={validation.status !== "complete"}
            onClick={() => {
              props.onCommit(draft);
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
          >
            {applyLabel}
          </button>
          <button
            type="button"
            data-testid={testId(props.testIds?.cancel, "dtrp-cancel")}
            onClick={closeAndDiscard}
          >
            {cancelLabel}
          </button>
          {props.clearable !== false ? (
            <button
              type="button"
              data-testid={testId(props.testIds?.clear, "dtrp-clear")}
              onClick={() => updateDraft(EMPTY_RANGE)}
            >
              {clearLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
