import { useCallback, useEffect, useRef, useState } from "react";

import {
  createDateTimeRangeDraft,
  transitionDateTimeRangeDraft,
  validateDateTimeRangeDraft,
  type DateTimeRangeDraftAction,
  type DateTimeRangeDraftField,
  type DateTimeRangeDraftState,
  type DateTimeRangeDraftTarget,
} from "./date-time-range-draft.js";
import type {
  DateTimeRangeChangeHandler,
  DateTimeRangeConstraints,
  DateTimeRangeSteps,
  DateTimeRangeValidationChangeHandler,
  DateTimeRangeValidationResult,
  DateTimeRangeValue,
  HourCycle,
  Precision,
} from "../types.js";

interface UseDateTimeRangeDraftOptions {
  value: DateTimeRangeValue;
  timezone: string;
  precision: Precision;
  hourCycle: HourCycle;
  constraints: DateTimeRangeConstraints;
  steps: DateTimeRangeSteps;
  required: boolean;
  onChange: DateTimeRangeChangeHandler;
  onValidationChange: DateTimeRangeValidationChangeHandler | undefined;
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
  changeDate: (
    target: DateTimeRangeDraftTarget,
    timestamp: number,
  ) => void;
  changeTimeUnit: (
    target: DateTimeRangeDraftTarget,
    unit: "hour" | "minute" | "second" | "millisecond",
    value: number,
  ) => void;
  changePeriod: (
    target: DateTimeRangeDraftTarget,
    period: "am" | "pm",
  ) => void;
  chooseOffset: (target: DateTimeRangeDraftTarget, index: number) => void;
}

function getValidationKey(validation: DateTimeRangeValidationResult): string {
  return `${validation.status}|${validation.errors
    .map((error) => `${error.target}:${error.code}`)
    .join("|")}`;
}

export function useDateTimeRangeDraft(
  options: UseDateTimeRangeDraftOptions,
): DateTimeRangeDraftController {
  const context = {
    timezone: options.timezone,
    precision: options.precision,
    hourCycle: options.hourCycle,
  };
  const [state, setState] = useState<DateTimeRangeDraftState>(() =>
    createDateTimeRangeDraft(options.value, context),
  );
  const stateRef = useRef(state);
  const validationKeyRef = useRef<string | null>(null);

  const replaceState = (nextState: DateTimeRangeDraftState): void => {
    stateRef.current = nextState;
    setState(nextState);
  };

  const reset = useCallback(
    (value: DateTimeRangeValue): void => {
      const nextState = createDateTimeRangeDraft(value, {
        timezone: options.timezone,
        precision: options.precision,
        hourCycle: options.hourCycle,
      });
      stateRef.current = nextState;
      setState(nextState);
    },
    [options.hourCycle, options.precision, options.timezone],
  );

  useEffect(() => {
    reset(options.value);
  }, [
    options.value.startTimestamp,
    options.value.endTimestamp,
    options.timezone,
    options.precision,
    options.hourCycle,
    reset,
  ]);

  const validation = validateDateTimeRangeDraft(state, {
    constraints: options.constraints,
    steps: options.steps,
    required: options.required,
    timezone: options.timezone,
  });
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

  const dispatch = (action: DateTimeRangeDraftAction): void => {
    const transition = transitionDateTimeRangeDraft(
      stateRef.current,
      action,
      context,
    );
    replaceState(transition.state);
    if (transition.changedValue !== null) {
      options.onChange(transition.changedValue);
    }
  };

  return {
    value: state.value,
    start: state.start,
    end: state.end,
    validation,
    replaceValue: (value) => dispatch({ type: "replace-value", value }),
    reset,
    changeText: (target, text) =>
      dispatch({ type: "change-text", target, text }),
    commitText: (target) => dispatch({ type: "commit-text", target }),
    changeDate: (target, timestamp) =>
      dispatch({ type: "change-date", target, timestamp }),
    changeTimeUnit: (target, unit, value) =>
      dispatch({ type: "change-time-unit", target, unit, value }),
    changePeriod: (target, period) =>
      dispatch({ type: "change-period", target, period }),
    chooseOffset: (target, index) =>
      dispatch({ type: "choose-offset", target, index }),
  };
}

export type { DateTimeRangeDraftField, DateTimeRangeDraftTarget };
