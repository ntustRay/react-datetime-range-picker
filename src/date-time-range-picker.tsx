import { useEffect, useRef, useState } from "react";

import {
  formatEditableTimestamp,
  formatDisplayTimestamp,
  getEditableDateTimeFormat,
  parseEditableDateTime,
} from "./internal/date-time-text.js";
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

export function DateTimeRangePicker(
  props: DateTimeRangePickerProps,
): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(props.value);
  const timezone = props.timezone ?? "UTC";
  const precision = props.precision ?? "second";
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
    const value: DateTimeRangeValue = {
      startTimestamp: target === "start" ? timestamp : draft.startTimestamp,
      endTimestamp: target === "end" ? timestamp : draft.endTimestamp,
    };
    updateDraft(value);
  };

  return (
    <div ref={rootRef} data-testid={props.testIds?.root ?? "dtrp-root"}>
      <button
        ref={triggerRef}
        type="button"
        data-testid={props.testIds?.trigger ?? "dtrp-trigger"}
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
          role="dialog"
          aria-label={triggerLabel}
          tabIndex={-1}
          data-testid={props.testIds?.popover ?? "dtrp-popover"}
        >
          {props.features?.textInput !== false ? (
            <div>
              <label>
                {props.labels?.start ?? "Start"}
                <input
                  aria-describedby={`dtrp-start-format ${validationDescriptionIds("start")}`.trim()}
                  data-testid={props.testIds?.startInput ?? "dtrp-start-input"}
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
                  data-testid={props.testIds?.endInput ?? "dtrp-end-input"}
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
            </div>
          ) : null}
          {validation.errors.length > 0 ? (
            <ul
              aria-live="polite"
              data-testid={props.testIds?.validation ?? "dtrp-validation"}
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
          {props.presets?.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={
                props.testIds?.preset?.(preset.id) ?? `dtrp-preset-${preset.id}`
              }
              onClick={() =>
                updateDraft(
                  preset.getValue({
                    nowTimestamp: Date.now(),
                    timezone: props.timezone ?? "UTC",
                    precision: props.precision ?? "second",
                  }),
                )
              }
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            data-testid={props.testIds?.apply ?? "dtrp-apply"}
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
            data-testid={props.testIds?.cancel ?? "dtrp-cancel"}
            onClick={closeAndDiscard}
          >
            {cancelLabel}
          </button>
          {props.clearable !== false ? (
            <button
              type="button"
              data-testid={props.testIds?.clear ?? "dtrp-clear"}
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
