import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatEditableTimestamp,
  parseEditableDateTime,
} from "./date-time-text.js";
import { isUnitVisible } from "./precision.js";
import { getLocalDateTime, type LocalDateTimeCandidate } from "./timezone.js";
import type {
  DateTimeRangeChangeHandler,
  DateTimeRangeConstraints,
  DateTimeRangeSteps,
  DateTimeRangeValidationChangeHandler,
  DateTimeRangeValidationError,
  DateTimeRangeValidationErrorCode,
  DateTimeRangeValidationResult,
  DateTimeRangeValue,
  Precision,
} from "../types.js";
import { validateDateTimeRange } from "../validate-date-time-range.js";

export type DateTimeRangeDraftTarget = "start" | "end";

interface UseDateTimeRangeDraftOptions {
  value: DateTimeRangeValue;
  timezone: string;
  precision: Precision;
  constraints: DateTimeRangeConstraints | undefined;
  steps: DateTimeRangeSteps | undefined;
  required: boolean | undefined;
  onChange: DateTimeRangeChangeHandler;
  onValidationChange: DateTimeRangeValidationChangeHandler | undefined;
}

export interface DateTimeRangeDraftField {
  text: string;
  time: string;
  error: DateTimeRangeValidationErrorCode | null;
  ambiguousCandidates: readonly LocalDateTimeCandidate[];
}

export interface DateTimeRangeDraftController {
  value: DateTimeRangeValue;
  start: DateTimeRangeDraftField;
  end: DateTimeRangeDraftField;
  validation: DateTimeRangeValidationResult;
  replaceValue: (value: DateTimeRangeValue) => void;
  reset: (value: DateTimeRangeValue) => void;
  changeText: (target: DateTimeRangeDraftTarget, text: string) => void;
  commitText: (target: DateTimeRangeDraftTarget) => void;
  changeTime: (target: DateTimeRangeDraftTarget, time: string) => void;
  chooseOffset: (target: DateTimeRangeDraftTarget, index: number) => void;
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

function getTextErrorCode(
  status: "ambiguous" | "invalid" | "nonexistent",
): DateTimeRangeValidationErrorCode {
  if (status === "nonexistent") return "nonexistent-local-time";
  if (status === "ambiguous") return "ambiguous-local-time";
  return "invalid-text";
}

function getValidationKey(validation: DateTimeRangeValidationResult): string {
  return `${validation.status}|${validation.errors
    .map((error) => `${error.target}:${error.code}`)
    .join("|")}`;
}

export function useDateTimeRangeDraft(
  options: UseDateTimeRangeDraftOptions,
): DateTimeRangeDraftController {
  const [value, setValue] = useState(options.value);
  const [startText, setStartText] = useState(() =>
    safelyFormatTimestamp(
      options.value.startTimestamp,
      options.timezone,
      options.precision,
    ),
  );
  const [endText, setEndText] = useState(() =>
    safelyFormatTimestamp(
      options.value.endTimestamp,
      options.timezone,
      options.precision,
    ),
  );
  const [startError, setStartError] =
    useState<DateTimeRangeValidationErrorCode | null>(null);
  const [endError, setEndError] =
    useState<DateTimeRangeValidationErrorCode | null>(null);
  const [startCandidates, setStartCandidates] = useState<
    readonly LocalDateTimeCandidate[]
  >([]);
  const [endCandidates, setEndCandidates] = useState<
    readonly LocalDateTimeCandidate[]
  >([]);
  const validationKeyRef = useRef<string | null>(null);

  const reset = useCallback(
    (nextValue: DateTimeRangeValue): void => {
      setValue(nextValue);
      setStartText(
        safelyFormatTimestamp(
          nextValue.startTimestamp,
          options.timezone,
          options.precision,
        ),
      );
      setEndText(
        safelyFormatTimestamp(
          nextValue.endTimestamp,
          options.timezone,
          options.precision,
        ),
      );
      setStartError(null);
      setEndError(null);
      setStartCandidates([]);
      setEndCandidates([]);
    },
    [options.timezone, options.precision],
  );

  useEffect(() => {
    reset(options.value);
  }, [
    options.value.startTimestamp,
    options.value.endTimestamp,
    options.timezone,
    options.precision,
    reset,
  ]);

  const rangeValidation = validateDateTimeRange(value, {
    ...(options.constraints === undefined
      ? {}
      : { constraints: options.constraints }),
    ...(options.steps === undefined ? {} : { steps: options.steps }),
    ...(options.required === undefined ? {} : { required: options.required }),
    timezone: options.timezone,
  });
  const textErrors: DateTimeRangeValidationError[] = [];
  if (startError !== null) {
    textErrors.push({ code: startError, target: "start" });
  }
  if (endError !== null) {
    textErrors.push({ code: endError, target: "end" });
  }
  const validation: DateTimeRangeValidationResult =
    textErrors.length === 0
      ? rangeValidation
      : {
          status: "invalid",
          errors: [...rangeValidation.errors, ...textErrors],
        };
  const validationKey = getValidationKey(validation);

  useEffect(() => {
    if (
      options.onValidationChange !== undefined &&
      validationKeyRef.current !== validationKey
    ) {
      validationKeyRef.current = validationKey;
      options.onValidationChange(validation);
    }
  }, [options.onValidationChange, validation, validationKey]);

  const replaceValue = (nextValue: DateTimeRangeValue): void => {
    setValue(nextValue);
    setStartText(
      safelyFormatTimestamp(
        nextValue.startTimestamp,
        options.timezone,
        options.precision,
      ),
    );
    setEndText(
      safelyFormatTimestamp(
        nextValue.endTimestamp,
        options.timezone,
        options.precision,
      ),
    );
    options.onChange(nextValue);
  };

  const changeText = (
    target: DateTimeRangeDraftTarget,
    text: string,
  ): void => {
    if (target === "start") {
      setStartText(text);
      setStartError("invalid-text");
    } else {
      setEndText(text);
      setEndError("invalid-text");
    }
  };

  const commitText = (target: DateTimeRangeDraftTarget): void => {
    const text = target === "start" ? startText : endText;
    const setError = target === "start" ? setStartError : setEndError;
    const setCandidates =
      target === "start" ? setStartCandidates : setEndCandidates;
    if (text === "") {
      setError(null);
      setCandidates([]);
      replaceValue({
        startTimestamp: target === "start" ? null : value.startTimestamp,
        endTimestamp: target === "end" ? null : value.endTimestamp,
      });
      return;
    }
    const result = parseEditableDateTime(
      text,
      options.timezone,
      options.precision,
    );
    if (result.status !== "valid") {
      setCandidates(result.status === "ambiguous" ? [...result.candidates] : []);
      setError(getTextErrorCode(result.status));
      return;
    }
    const timestamp = result.candidates[0]?.timestamp;
    if (timestamp === undefined) {
      setCandidates([]);
      setError("invalid-text");
      return;
    }
    setError(null);
    setCandidates([]);
    replaceValue({
      startTimestamp: target === "start" ? timestamp : value.startTimestamp,
      endTimestamp: target === "end" ? timestamp : value.endTimestamp,
    });
  };

  const chooseOffset = (
    target: DateTimeRangeDraftTarget,
    index: number,
  ): void => {
    const candidates = target === "start" ? startCandidates : endCandidates;
    const candidate = candidates[index];
    if (candidate === undefined) return;
    if (target === "start") {
      setStartCandidates([]);
      setStartError(null);
    } else {
      setEndCandidates([]);
      setEndError(null);
    }
    replaceValue({
      startTimestamp:
        target === "start" ? candidate.timestamp : value.startTimestamp,
      endTimestamp: target === "end" ? candidate.timestamp : value.endTimestamp,
    });
  };

  const changeTime = (
    target: DateTimeRangeDraftTarget,
    time: string,
  ): void => {
    const currentText = target === "start" ? startText : endText;
    const dateText = currentText.split(" ")[0];
    if (dateText === undefined || time === "") return;
    const editableTime =
      options.precision === "hour"
        ? time.slice(0, 2)
        : options.precision === "minute"
          ? time.slice(0, 5)
          : options.precision === "second"
            ? time.slice(0, 8)
            : time;
    const result = parseEditableDateTime(
      `${dateText} ${editableTime}`,
      options.timezone,
      options.precision,
    );
    const setError = target === "start" ? setStartError : setEndError;
    if (result.status !== "valid") {
      setError(getTextErrorCode(result.status));
      return;
    }
    const timestamp = result.candidates[0]?.timestamp;
    if (timestamp === undefined) {
      setError("invalid-text");
      return;
    }
    setError(null);
    replaceValue({
      startTimestamp: target === "start" ? timestamp : value.startTimestamp,
      endTimestamp: target === "end" ? timestamp : value.endTimestamp,
    });
  };

  return {
    value,
    start: {
      text: startText,
      time: formatTimeInput(value.startTimestamp, options.timezone, options.precision),
      error: startError,
      ambiguousCandidates: startCandidates,
    },
    end: {
      text: endText,
      time: formatTimeInput(value.endTimestamp, options.timezone, options.precision),
      error: endError,
      ambiguousCandidates: endCandidates,
    },
    validation,
    replaceValue,
    reset,
    changeText,
    commitText,
    changeTime,
    chooseOffset,
  };
}
