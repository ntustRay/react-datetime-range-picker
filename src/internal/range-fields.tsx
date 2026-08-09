import type { RefObject } from "react";

import { getTestId } from "./test-id.js";
import type {
  DateTimeRangeDraftField,
  DateTimeRangeDraftTarget,
} from "./date-time-range-draft.js";
import type {
  DateTimeRangeLocaleText,
  DateTimeRangeTestIds,
} from "../types.js";

interface RangeFieldsProps {
  dialogId: string;
  isOpen: boolean;
  activeTarget: DateTimeRangeDraftTarget;
  start: DateTimeRangeDraftField;
  end: DateTimeRangeDraftField;
  startInputRef: RefObject<HTMLInputElement | null>;
  endInputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  endDisabled: boolean;
  readOnly: boolean;
  canOpen: boolean;
  localeText: DateTimeRangeLocaleText;
  testIds: Partial<DateTimeRangeTestIds>;
  getDescriptionIds: (target: DateTimeRangeDraftTarget) => string;
  onFocus: (target: DateTimeRangeDraftTarget) => void;
  onChange: (target: DateTimeRangeDraftTarget, text: string) => void;
  onCommit: (target: DateTimeRangeDraftTarget) => void;
  onOpenCalendar: () => void;
}

interface RangeInputProps {
  target: DateTimeRangeDraftTarget;
  field: DateTimeRangeDraftField;
  inputRef: RefObject<HTMLInputElement | null>;
  props: RangeFieldsProps;
}

function RangeInput(input: RangeInputProps): React.JSX.Element {
  const label =
    input.target === "start"
      ? input.props.localeText.startLabel
      : input.props.localeText.endLabel;
  const placeholder =
    input.target === "start"
      ? input.props.localeText.startFormatHint
      : input.props.localeText.endFormatHint;
  const testId =
    input.target === "start"
      ? input.props.testIds.startInput
      : input.props.testIds.endInput;

  return (
    <input
      ref={input.inputRef}
      className="dtrp-range-input"
      aria-label={label}
      aria-controls={input.props.dialogId}
      aria-expanded={input.props.isOpen && input.props.activeTarget === input.target}
      aria-invalid={input.field.error === null ? undefined : true}
      aria-describedby={input.props.getDescriptionIds(input.target) || undefined}
      placeholder={placeholder}
      value={input.field.text}
      disabled={input.target === "start" ? input.props.disabled : input.props.endDisabled}
      readOnly={input.props.readOnly}
      data-active={input.props.isOpen && input.props.activeTarget === input.target}
      data-testid={getTestId(testId, `dtrp-${input.target}-input`)}
      onFocus={() => input.props.onFocus(input.target)}
      onChange={(event) =>
        input.props.onChange(input.target, event.currentTarget.value)
      }
      onBlur={() => input.props.onCommit(input.target)}
      onKeyDown={(event) => {
        if (event.key === "Enter") input.props.onCommit(input.target);
      }}
    />
  );
}

export function RangeFields(props: RangeFieldsProps): React.JSX.Element {
  return (
    <div className="dtrp-trigger" role="group" aria-label={props.localeText.triggerLabel}>
      <RangeInput
        target="start"
        field={props.start}
        inputRef={props.startInputRef}
        props={props}
      />
      <span className="dtrp-trigger-separator" aria-hidden="true">
        ~
      </span>
      <RangeInput
        target="end"
        field={props.end}
        inputRef={props.endInputRef}
        props={props}
      />
      <button
        type="button"
        className="dtrp-calendar-button"
        aria-label={props.localeText.calendarButtonLabel}
        aria-haspopup="dialog"
        aria-expanded={props.isOpen}
        aria-controls={props.dialogId}
        disabled={!props.canOpen}
        data-testid={getTestId(props.testIds.trigger, "dtrp-trigger")}
        onClick={props.onOpenCalendar}
      >
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
        </svg>
      </button>
    </div>
  );
}
