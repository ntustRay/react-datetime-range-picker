import { getEditableDateTimeFormat } from "./date-time-text.js";
import { isUnitVisible } from "./precision.js";
import { formatTimezoneOffset } from "./timezone.js";
import { getTestId } from "./test-id.js";
import type {
  DateTimeRangeDraftController,
  DateTimeRangeDraftField,
  DateTimeRangeDraftTarget,
} from "./use-date-time-range-draft.js";
import type {
  DateTimeRangeLabels,
  DateTimeRangeSteps,
  DateTimeRangeTestIds,
  Precision,
} from "../types.js";

interface DateTimeFieldsProps {
  draft: DateTimeRangeDraftController;
  precision: Precision;
  steps: DateTimeRangeSteps | undefined;
  labels: Partial<DateTimeRangeLabels> | undefined;
  testIds: Partial<DateTimeRangeTestIds> | undefined;
  startDescriptionIds: string;
  endDescriptionIds: string;
}

interface AmbiguousOffsetFieldProps {
  target: DateTimeRangeDraftTarget;
  field: DateTimeRangeDraftField;
  targetLabel: string;
  labels: Partial<DateTimeRangeLabels> | undefined;
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
      {props.targetLabel} offset
      <select
        aria-label={`${props.targetLabel} offset`}
        value=""
        onChange={(event) =>
          props.onChoose(props.target, Number(event.currentTarget.value))
        }
      >
        <option value="">
          {props.labels?.earlierOffset ?? "Choose an offset"}
        </option>
        {props.field.ambiguousCandidates.map((candidate, index) => (
          <option key={candidate.timestamp} value={index}>
            {index === 0
              ? props.labels?.earlierOffset ?? "Earlier"
              : props.labels?.laterOffset ?? "Later"}{" "}
            ({formatTimezoneOffset(candidate.offsetMinutes)})
          </option>
        ))}
      </select>
    </label>
  );
}

export function DateTimeFields(props: DateTimeFieldsProps): React.JSX.Element {
  const startLabel = props.labels?.start ?? "Start";
  const endLabel = props.labels?.end ?? "End";
  const showTime = isUnitVisible("hour", props.precision);
  const timeType = isUnitVisible("millisecond", props.precision) ? "text" : "time";
  const step = timeInputStep(
    props.precision,
    props.steps?.[stepUnit(props.precision)] ?? 1,
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
            {props.labels?.startFormatHint ??
              getEditableDateTimeFormat(props.precision)}
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
            {props.labels?.endFormatHint ??
              getEditableDateTimeFormat(props.precision)}
          </span>
        </label>
        {showTime ? (
          <div className="dtrp-time-fields">
            <label className="dtrp-field">
              {startLabel} time
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
              {endLabel} time
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
        targetLabel={startLabel}
        labels={props.labels}
        onChoose={props.draft.chooseOffset}
      />
      <AmbiguousOffsetField
        target="end"
        field={props.draft.end}
        targetLabel={endLabel}
        labels={props.labels}
        onChoose={props.draft.chooseOffset}
      />
    </>
  );
}
