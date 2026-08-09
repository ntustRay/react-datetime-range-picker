import { isUnitVisible } from "./precision.js";
import { formatTimezoneOffset } from "./timezone.js";
import { getTestId } from "./test-id.js";
import type {
  DateTimeRangeDraftController,
  DateTimeRangeDraftField,
  DateTimeRangeDraftTarget,
} from "./use-date-time-range-draft.js";
import type {
  DateTimeRangeLocaleText,
  DateTimeRangeSteps,
  DateTimeRangeTestIds,
  Precision,
} from "../types.js";

interface DateTimeFieldsProps {
  draft: DateTimeRangeDraftController;
  precision: Precision;
  steps: DateTimeRangeSteps;
  localeText: DateTimeRangeLocaleText;
  testIds: Partial<DateTimeRangeTestIds> | undefined;
  startDescriptionIds: string;
  endDescriptionIds: string;
}

interface AmbiguousOffsetFieldProps {
  target: DateTimeRangeDraftTarget;
  field: DateTimeRangeDraftField;
  offsetLabel: string;
  localeText: DateTimeRangeLocaleText;
  onChoose: (target: DateTimeRangeDraftTarget, index: number) => void;
}

function timeInputStep(precision: Precision, step: number): string {
  if (precision === "hour") return "3600";
  if (precision === "minute") return String(step * 60);
  if (precision === "second") return String(step);
  if (precision === "millisecond") return String(step / 1_000);
  return "60";
}

function stepUnit(precision: Precision): keyof DateTimeRangeSteps {
  if (isUnitVisible("minute", precision)) return "minute";
  if (isUnitVisible("second", precision)) return "second";
  return "millisecond";
}

function AmbiguousOffsetField(
  props: AmbiguousOffsetFieldProps,
): React.JSX.Element | null {
  if (props.field.ambiguousCandidates.length === 0) return null;
  return (
    <label className="dtrp-field">
      {props.offsetLabel}
      <select
        aria-label={props.offsetLabel}
        value=""
        onChange={(event) =>
          props.onChoose(props.target, Number(event.currentTarget.value))
        }
      >
        <option value="">
          {props.localeText.chooseOffsetLabel}
        </option>
        {props.field.ambiguousCandidates.map((candidate, index) => (
          <option key={candidate.timestamp} value={index}>
            {index === 0
              ? props.localeText.earlierOffsetLabel
              : props.localeText.laterOffsetLabel}{" "}
            ({formatTimezoneOffset(candidate.offsetMinutes)})
          </option>
        ))}
      </select>
    </label>
  );
}

export function DateTimeFields(props: DateTimeFieldsProps): React.JSX.Element {
  const startLabel = props.localeText.startLabel;
  const endLabel = props.localeText.endLabel;
  const showTime = isUnitVisible("hour", props.precision);
  const timeType = isUnitVisible("millisecond", props.precision)
    ? "text"
    : "time";
  const step = timeInputStep(
    props.precision,
    props.steps[stepUnit(props.precision)],
  );

  return (
    <>
      <div className="dtrp-fields">
        <label className="dtrp-field dtrp-field-start">
          {startLabel}
          <input
            aria-label={startLabel}
            aria-describedby={props.startDescriptionIds}
            data-testid={getTestId(props.testIds?.startInput, "dtrp-start-input")}
            value={props.draft.start.text}
            aria-invalid={props.draft.start.error === null ? undefined : true}
            onChange={(event) =>
              props.draft.changeText("start", event.currentTarget.value)
            }
            onBlur={() => props.draft.commitText("start")}
          />
          <span className="dtrp-format-hint" id="dtrp-start-format">
            {props.localeText.startFormatHint}
          </span>
        </label>
        <label className="dtrp-field dtrp-field-end">
          {endLabel}
          <input
            aria-label={endLabel}
            aria-describedby={props.endDescriptionIds}
            data-testid={getTestId(props.testIds?.endInput, "dtrp-end-input")}
            value={props.draft.end.text}
            aria-invalid={props.draft.end.error === null ? undefined : true}
            onChange={(event) =>
              props.draft.changeText("end", event.currentTarget.value)
            }
            onBlur={() => props.draft.commitText("end")}
          />
          <span className="dtrp-format-hint" id="dtrp-end-format">
            {props.localeText.endFormatHint}
          </span>
        </label>
        {showTime ? (
          <div className="dtrp-time-fields">
            <label className="dtrp-field">
              {props.localeText.startTimeLabel}
              <input
                type={timeType}
                step={step}
                data-testid={getTestId(props.testIds?.startTime, "dtrp-start-time")}
                value={props.draft.start.time}
                onChange={(event) =>
                  props.draft.changeTime("start", event.currentTarget.value)
                }
              />
            </label>
            <label className="dtrp-field">
              {props.localeText.endTimeLabel}
              <input
                type={timeType}
                step={step}
                data-testid={getTestId(props.testIds?.endTime, "dtrp-end-time")}
                value={props.draft.end.time}
                onChange={(event) =>
                  props.draft.changeTime("end", event.currentTarget.value)
                }
              />
            </label>
          </div>
        ) : null}
      </div>
      <AmbiguousOffsetField
        target="start"
        field={props.draft.start}
        offsetLabel={props.localeText.startOffsetLabel}
        localeText={props.localeText}
        onChoose={props.draft.chooseOffset}
      />
      <AmbiguousOffsetField
        target="end"
        field={props.draft.end}
        offsetLabel={props.localeText.endOffsetLabel}
        localeText={props.localeText}
        onChoose={props.draft.chooseOffset}
      />
    </>
  );
}
