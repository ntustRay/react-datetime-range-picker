import { useEffect, useId, useRef, useState } from "react";

import { formatDisplayTimestamp } from "./internal/date-time-text.js";
import { resolvePickerConfiguration } from "./internal/picker-configuration.js";
import { PickerPopover } from "./internal/picker-popover.js";
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
  const configuration = resolvePickerConfiguration(props);
  const draft = useDateTimeRangeDraft({
    value: props.value,
    timezone: configuration.timezone,
    precision: configuration.precision,
    constraints: configuration.constraints,
    steps: configuration.steps,
    required: configuration.required,
    onChange: props.onChange,
    onValidationChange: props.onValidationChange,
  });

  const triggerLabel = configuration.localeText.triggerLabel;
  const rangeSummary =
    props.value.startTimestamp === null
      ? triggerLabel
      : props.value.endTimestamp === null
        ? `${formatDisplayTimestamp(
            props.value.startTimestamp,
            configuration.timezone,
            configuration.locale,
            configuration.precision,
          )} – …`
        : `${formatDisplayTimestamp(
            props.value.startTimestamp,
            configuration.timezone,
            configuration.locale,
            configuration.precision,
          )} – ${formatDisplayTimestamp(
            props.value.endTimestamp,
            configuration.timezone,
            configuration.locale,
            configuration.precision,
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
      data-testid={getTestId(configuration.testIds.root, "dtrp-root")}
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid={getTestId(configuration.testIds.trigger, "dtrp-trigger")}
        disabled={!configuration.canOpen}
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
          configuration={configuration}
          draft={draft}
          dialog={{ id: dialogId, label: triggerLabel, ref: dialogRef }}
          onCancel={closeAndDiscard}
          onApply={applyDraft}
        />
      ) : null}
    </div>
  );
}
