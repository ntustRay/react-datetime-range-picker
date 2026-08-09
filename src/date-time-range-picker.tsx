import { useEffect, useId, useRef, useState } from "react";

import { formatDisplayTimestamp } from "./internal/date-time-text.js";
import { PickerPopover } from "./internal/picker-popover.js";
import { resolveLocaleText } from "./internal/locale-text.js";
import { getTestId } from "./internal/test-id.js";
import { useDateTimeRangeDraft } from "./internal/use-date-time-range-draft.js";
import type {
  DateTimeRangePickerProps,
  DateTimeRangeValue,
} from "./types.js";

function rangesEqual(
  first: DateTimeRangeValue,
  second: DateTimeRangeValue,
): boolean {
  return (
    first.startTimestamp === second.startTimestamp &&
    first.endTimestamp === second.endTimestamp
  );
}

export function DateTimeRangePicker(
  props: DateTimeRangePickerProps,
): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openedValueRef = useRef(props.value);
  const timezone = props.timezone ?? "UTC";
  const precision = props.precision ?? "second";
  const draft = useDateTimeRangeDraft({
    value: props.value,
    timezone,
    precision,
    constraints: props.constraints,
    steps: props.steps,
    required: props.required,
    onChange: props.onChange,
    onValidationChange: props.onValidationChange,
  });
  const localeText = resolveLocaleText(props.localeText, precision);

  const calendarEnabled = props.features?.calendar !== false;
  const textInputEnabled =
    props.features?.textInput !== false || calendarEnabled === false;
  const triggerLabel = localeText.triggerLabel;
  const rangeSummary =
    props.value.startTimestamp === null
      ? triggerLabel
      : props.value.endTimestamp === null
        ? `${formatDisplayTimestamp(
            props.value.startTimestamp,
            timezone,
            props.locale ?? "en",
            precision,
          )} – …`
        : `${formatDisplayTimestamp(
            props.value.startTimestamp,
            timezone,
            props.locale ?? "en",
            precision,
          )} – ${formatDisplayTimestamp(
            props.value.endTimestamp,
            timezone,
            props.locale ?? "en",
            precision,
          )}`;

  const restoreTriggerFocus = (): void => {
    triggerRef.current?.focus();
  };

  const closeAndDiscard = (): void => {
    const openedValue = openedValueRef.current;
    draft.reset(openedValue);
    if (!rangesEqual(props.value, openedValue)) {
      props.onChange(openedValue);
    }
    setIsOpen(false);
    restoreTriggerFocus();
  };

  const openPicker = (): void => {
    openedValueRef.current = props.value;
    draft.reset(props.value);
    setIsOpen(true);
  };

  const applyDraft = (): void => {
    props.onCommit(draft.value);
    setIsOpen(false);
    restoreTriggerFocus();
  };

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

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
  }, [isOpen, closeAndDiscard]);

  return (
    <div
      ref={rootRef}
      className="dtrp-root"
      data-testid={getTestId(props.testIds?.root, "dtrp-root")}
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid={getTestId(props.testIds?.trigger, "dtrp-trigger")}
        disabled={props.disabled === true || props.readOnly === true}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        className="dtrp-trigger"
        onClick={openPicker}
      >
        {rangeSummary}
      </button>
      {isOpen ? (
        <PickerPopover
          pickerProps={props}
          localeText={localeText}
          draft={draft}
          timezone={timezone}
          precision={precision}
          calendarEnabled={calendarEnabled}
          textInputEnabled={textInputEnabled}
          dialogId={dialogId}
          triggerLabel={triggerLabel}
          dialogRef={dialogRef}
          onCancel={closeAndDiscard}
          onApply={applyDraft}
        />
      ) : null}
    </div>
  );
}
