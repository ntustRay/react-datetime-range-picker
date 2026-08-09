import {
  formatEditableTimestamp,
  parseEditableDateTime,
} from "./date-time-text.js";
import {
  getLocalDateTime,
  resolveLocalDateTime,
  type LocalDateTimeCandidate,
} from "./timezone.js";
import { validateDateTimeRange } from "./validate-date-time-range.js";
import type {
  DateTimeRangeConstraints,
  DateTimeRangeSteps,
  DateTimeRangeValidationError,
  DateTimeRangeValidationErrorCode,
  DateTimeRangeValidationResult,
  DateTimeRangeValue,
  HourCycle,
  Precision,
  Timestamp,
} from "../types.js";

export type DateTimeRangeDraftTarget = "start" | "end";

export interface DateTimeRangeDraftContext {
  timezone: string;
  precision: Precision;
  hourCycle: HourCycle;
}

export interface DateTimeRangeDraftField {
  text: string;
  error: DateTimeRangeValidationErrorCode | null;
  ambiguousCandidates: readonly LocalDateTimeCandidate[];
}

export interface DateTimeRangeDraftState {
  value: DateTimeRangeValue;
  start: DateTimeRangeDraftField;
  end: DateTimeRangeDraftField;
}

export type DateTimeRangeDraftAction =
  | { type: "replace-value"; value: DateTimeRangeValue }
  | { type: "change-text"; target: DateTimeRangeDraftTarget; text: string }
  | { type: "commit-text"; target: DateTimeRangeDraftTarget }
  | {
      type: "change-date";
      target: DateTimeRangeDraftTarget;
      timestamp: Timestamp;
    }
  | {
      type: "change-time-unit";
      target: DateTimeRangeDraftTarget;
      unit: "hour" | "minute" | "second" | "millisecond";
      value: number;
    }
  | {
      type: "change-period";
      target: DateTimeRangeDraftTarget;
      period: "am" | "pm";
    }
  | { type: "choose-offset"; target: DateTimeRangeDraftTarget; index: number };

export interface DateTimeRangeDraftTransition {
  state: DateTimeRangeDraftState;
  changedValue: DateTimeRangeValue | null;
}

export interface DateTimeRangeDraftValidationOptions {
  constraints: DateTimeRangeConstraints;
  steps: DateTimeRangeSteps;
  required: boolean;
  timezone: string;
}

function safelyFormatTimestamp(
  timestamp: Timestamp | null,
  context: DateTimeRangeDraftContext,
): string {
  if (timestamp === null) return "";
  try {
    return formatEditableTimestamp(
      timestamp,
      context.timezone,
      context.precision,
      context.hourCycle,
    );
  } catch {
    return String(timestamp);
  }
}

function createField(
  timestamp: Timestamp | null,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftField {
  return {
    text: safelyFormatTimestamp(timestamp, context),
    error: null,
    ambiguousCandidates: [],
  };
}

export function createDateTimeRangeDraft(
  value: DateTimeRangeValue,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftState {
  return {
    value,
    start: createField(value.startTimestamp, context),
    end: createField(value.endTimestamp, context),
  };
}

function replaceTimestamp(
  value: DateTimeRangeValue,
  target: DateTimeRangeDraftTarget,
  timestamp: Timestamp | null,
): DateTimeRangeValue {
  return {
    startTimestamp: target === "start" ? timestamp : value.startTimestamp,
    endTimestamp: target === "end" ? timestamp : value.endTimestamp,
  };
}

function updateField(
  state: DateTimeRangeDraftState,
  target: DateTimeRangeDraftTarget,
  field: DateTimeRangeDraftField,
): DateTimeRangeDraftState {
  return target === "start"
    ? { ...state, start: field }
    : { ...state, end: field };
}

function synchronizeValue(
  state: DateTimeRangeDraftState,
  value: DateTimeRangeValue,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftState {
  return {
    value,
    start: {
      ...state.start,
      text: safelyFormatTimestamp(value.startTimestamp, context),
    },
    end: {
      ...state.end,
      text: safelyFormatTimestamp(value.endTimestamp, context),
    },
  };
}

function getTextErrorCode(
  status: "ambiguous" | "invalid" | "nonexistent",
): DateTimeRangeValidationErrorCode {
  if (status === "nonexistent") return "nonexistent-local-time";
  if (status === "ambiguous") return "ambiguous-local-time";
  return "invalid-text";
}

function invalidField(
  field: DateTimeRangeDraftField,
  status: "ambiguous" | "invalid" | "nonexistent",
  candidates: readonly LocalDateTimeCandidate[],
): DateTimeRangeDraftField {
  return {
    ...field,
    error: getTextErrorCode(status),
    ambiguousCandidates: status === "ambiguous" ? candidates : [],
  };
}

function transitionTextCommit(
  state: DateTimeRangeDraftState,
  target: DateTimeRangeDraftTarget,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftTransition {
  const field = state[target];
  if (field.text === "") {
    const changedValue = replaceTimestamp(state.value, target, null);
    const nextState = updateField(state, target, {
      ...field,
      error: null,
      ambiguousCandidates: [],
    });
    return {
      state: synchronizeValue(nextState, changedValue, context),
      changedValue,
    };
  }

  const result = parseEditableDateTime(
    field.text,
    context.timezone,
    context.precision,
    context.hourCycle,
  );
  if (result.status !== "valid") {
    return {
      state: updateField(
        state,
        target,
        invalidField(field, result.status, result.candidates),
      ),
      changedValue: null,
    };
  }

  const timestamp = result.candidates[0]?.timestamp;
  if (timestamp === undefined) {
    return {
      state: updateField(state, target, invalidField(field, "invalid", [])),
      changedValue: null,
    };
  }
  const changedValue = replaceTimestamp(state.value, target, timestamp);
  const nextState = updateField(state, target, {
    ...field,
    error: null,
    ambiguousCandidates: [],
  });
  return {
    state: synchronizeValue(nextState, changedValue, context),
    changedValue,
  };
}

function transitionLocalDateTimeChange(
  state: DateTimeRangeDraftState,
  target: DateTimeRangeDraftTarget,
  local: ReturnType<typeof getLocalDateTime>,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftTransition {
  const resolution = resolveLocalDateTime(local, context.timezone);
  if (resolution.status !== "exact") {
    return {
      state: updateField(
        state,
        target,
        invalidField(
          state[target],
          resolution.status,
          resolution.candidates,
        ),
      ),
      changedValue: null,
    };
  }
  const timestamp = resolution.candidates[0]?.timestamp;
  if (timestamp === undefined) {
    return {
      state: updateField(
        state,
        target,
        invalidField(state[target], "invalid", []),
      ),
      changedValue: null,
    };
  }
  const changedValue = replaceTimestamp(state.value, target, timestamp);
  const nextState = updateField(state, target, {
    ...state[target],
    error: null,
    ambiguousCandidates: [],
  });
  return {
    state: synchronizeValue(nextState, changedValue, context),
    changedValue,
  };
}

function transitionDateChange(
  state: DateTimeRangeDraftState,
  target: DateTimeRangeDraftTarget,
  timestamp: Timestamp,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftTransition {
  const selectedDate = getLocalDateTime(timestamp, context.timezone);
  const currentTimestamp =
    target === "start"
      ? state.value.startTimestamp
      : state.value.endTimestamp;
  const current =
    currentTimestamp === null
      ? selectedDate
      : getLocalDateTime(currentTimestamp, context.timezone);
  return transitionLocalDateTimeChange(
    state,
    target,
    {
      ...current,
      year: selectedDate.year,
      month: selectedDate.month,
      day: selectedDate.day,
    },
    context,
  );
}

function transitionTimeUnitChange(
  state: DateTimeRangeDraftState,
  target: DateTimeRangeDraftTarget,
  unit: "hour" | "minute" | "second" | "millisecond",
  value: number,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftTransition {
  const timestamp =
    target === "start"
      ? state.value.startTimestamp
      : state.value.endTimestamp;
  if (timestamp === null) return { state, changedValue: null };
  const local = getLocalDateTime(timestamp, context.timezone);
  local[unit] = value;
  return transitionLocalDateTimeChange(state, target, local, context);
}

function transitionPeriodChange(
  state: DateTimeRangeDraftState,
  target: DateTimeRangeDraftTarget,
  period: "am" | "pm",
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftTransition {
  const timestamp =
    target === "start"
      ? state.value.startTimestamp
      : state.value.endTimestamp;
  if (timestamp === null) return { state, changedValue: null };
  const local = getLocalDateTime(timestamp, context.timezone);
  local.hour = local.hour % 12 + (period === "pm" ? 12 : 0);
  return transitionLocalDateTimeChange(state, target, local, context);
}

export function transitionDateTimeRangeDraft(
  state: DateTimeRangeDraftState,
  action: DateTimeRangeDraftAction,
  context: DateTimeRangeDraftContext,
): DateTimeRangeDraftTransition {
  if (action.type === "replace-value") {
    return {
      state: createDateTimeRangeDraft(action.value, context),
      changedValue: action.value,
    };
  }
  if (action.type === "change-text") {
    return {
      state: updateField(state, action.target, {
        ...state[action.target],
        text: action.text,
        error: "invalid-text",
        ambiguousCandidates: [],
      }),
      changedValue: null,
    };
  }
  if (action.type === "commit-text") {
    return transitionTextCommit(state, action.target, context);
  }
  if (action.type === "change-date") {
    return transitionDateChange(
      state,
      action.target,
      action.timestamp,
      context,
    );
  }
  if (action.type === "change-time-unit") {
    return transitionTimeUnitChange(
      state,
      action.target,
      action.unit,
      action.value,
      context,
    );
  }
  if (action.type === "change-period") {
    return transitionPeriodChange(
      state,
      action.target,
      action.period,
      context,
    );
  }
  const candidate = state[action.target].ambiguousCandidates[action.index];
  if (candidate === undefined) return { state, changedValue: null };
  const changedValue = replaceTimestamp(
    state.value,
    action.target,
    candidate.timestamp,
  );
  const nextState = updateField(state, action.target, {
    ...state[action.target],
    error: null,
    ambiguousCandidates: [],
  });
  return {
    state: synchronizeValue(nextState, changedValue, context),
    changedValue,
  };
}

export function validateDateTimeRangeDraft(
  state: DateTimeRangeDraftState,
  options: DateTimeRangeDraftValidationOptions,
): DateTimeRangeValidationResult {
  const rangeValidation = validateDateTimeRange(state.value, {
    constraints: options.constraints,
    steps: options.steps,
    required: options.required,
    timezone: options.timezone,
  });
  const textErrors: DateTimeRangeValidationError[] = [];
  if (state.start.error !== null) {
    textErrors.push({ code: state.start.error, target: "start" });
  }
  if (state.end.error !== null) {
    textErrors.push({ code: state.end.error, target: "end" });
  }
  if (textErrors.length === 0) return rangeValidation;
  return {
    status: "invalid",
    errors: [...rangeValidation.errors, ...textErrors],
  };
}
