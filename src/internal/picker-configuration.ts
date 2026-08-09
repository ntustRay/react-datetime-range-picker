import { resolveLocaleText } from "./locale-text.js";
import type {
  DateTimeRangeConstraints,
  DateTimeRangeLocaleText,
  DateTimeRangePickerProps,
  ColorScheme,
  DateTimeRangePreset,
  DateTimeRangeSteps,
  DateTimeRangeTestIds,
  DateTimeRangeTimezoneChangeHandler,
  DateTimeRangeHourCycleChangeHandler,
  HourCycle,
  Precision,
  Timezone,
  Weekday,
} from "../types.js";

const DEFAULT_CONSTRAINTS: DateTimeRangeConstraints = {
  minTimestamp: null,
  maxTimestamp: null,
  maxDurationMilliseconds: null,
};

const DEFAULT_STEPS: DateTimeRangeSteps = {
  minute: 1,
  second: 1,
  millisecond: 1,
};

export interface PickerConfiguration {
  timezone: Timezone;
  hourCycle: HourCycle;
  colorScheme: ColorScheme;
  precision: Precision;
  locale: string;
  localeText: DateTimeRangeLocaleText;
  firstWeekday: Weekday | null;
  constraints: DateTimeRangeConstraints;
  steps: DateTimeRangeSteps;
  calendarEnabled: boolean;
  textInputEnabled: boolean;
  timezoneSelectorEnabled: boolean;
  timezoneOptions: readonly Timezone[];
  presets: readonly DateTimeRangePreset[];
  testIds: Partial<DateTimeRangeTestIds>;
  clearable: boolean;
  disabled: boolean;
  readOnly: boolean;
  canOpen: boolean;
  required: boolean;
  onTimezoneChange: DateTimeRangeTimezoneChangeHandler | null;
  onHourCycleChange: DateTimeRangeHourCycleChangeHandler | null;
}

export function resolvePickerConfiguration(
  props: DateTimeRangePickerProps,
): PickerConfiguration {
  const timezone = props.timezone ?? "UTC";
  const precision = props.precision ?? "second";
  const hourCycle = props.hourCycle ?? "h24";
  const calendarEnabled = props.features?.calendar !== false;

  return {
    timezone,
    hourCycle,
    colorScheme: props.colorScheme ?? "light",
    precision,
    locale: props.locale ?? "en",
    localeText: resolveLocaleText(props.localeText, precision, hourCycle),
    firstWeekday: props.firstWeekday ?? null,
    constraints: props.constraints ?? DEFAULT_CONSTRAINTS,
    steps: props.steps ?? DEFAULT_STEPS,
    calendarEnabled,
    textInputEnabled: props.features?.textInput !== false || !calendarEnabled,
    timezoneSelectorEnabled: props.features?.timezoneSelector !== false,
    timezoneOptions: props.timezoneOptions ?? [timezone],
    presets: props.presets ?? [],
    testIds: props.testIds ?? {},
    clearable: props.clearable !== false,
    disabled: props.disabled === true,
    readOnly: props.readOnly === true,
    canOpen: props.disabled !== true && props.readOnly !== true,
    required: props.required === true,
    onTimezoneChange: props.onTimezoneChange ?? null,
    onHourCycleChange: props.onHourCycleChange ?? null,
  };
}
