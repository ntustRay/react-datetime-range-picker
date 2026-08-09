import { useEffect, useId, useRef, useState } from "react";

import type { DateTimeRangeDraftTarget } from "./internal/date-time-range-draft.js";
import { resolvePickerConfiguration } from "./internal/picker-configuration.js";
import { PickerPopover } from "./internal/picker-popover.js";
import { RangeFields } from "./internal/range-fields.js";
import { getTestId } from "./internal/test-id.js";
import { useDateTimeRangeDraft } from "./internal/use-date-time-range-draft.js";
import type {
  DateTimeRangePickerProps,
  DateTimeRangeValue,
} from "./types.js";

interface DebounceTimers {
  start: ReturnType<typeof setTimeout> | null;
  end: ReturnType<typeof setTimeout> | null;
}

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
  const [activeTarget, setActiveTarget] =
    useState<DateTimeRangeDraftTarget>("start");
  const dialogId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openedValueRef = useRef(props.value);
  const focusPopoverRef = useRef(false);
  const suppressFocusOpenRef = useRef(false);
  const debounceTimersRef = useRef<DebounceTimers>({ start: null, end: null });
  const configuration = resolvePickerConfiguration(props);
  const draft = useDateTimeRangeDraft({
    value: props.value,
    timezone: configuration.timezone,
    precision: configuration.precision,
    hourCycle: configuration.hourCycle,
    constraints: configuration.constraints,
    steps: configuration.steps,
    required: configuration.required,
    onChange: props.onChange,
    onValidationChange: props.onValidationChange,
  });

  const clearDebounce = (target: DateTimeRangeDraftTarget): void => {
    const timer = debounceTimersRef.current[target];
    if (timer !== null) clearTimeout(timer);
    debounceTimersRef.current[target] = null;
  };

  const clearAllDebounces = (): void => {
    clearDebounce("start");
    clearDebounce("end");
  };

  const commitInput = (target: DateTimeRangeDraftTarget): void => {
    clearDebounce(target);
    draft.commitText(target);
  };

  const changeInput = (
    target: DateTimeRangeDraftTarget,
    text: string,
  ): void => {
    clearDebounce(target);
    draft.changeText(target, text);
    debounceTimersRef.current[target] = setTimeout(() => {
      draft.commitText(target);
      debounceTimersRef.current[target] = null;
    }, 300);
  };

  const focusTargetInput = (target: DateTimeRangeDraftTarget): void => {
    suppressFocusOpenRef.current = true;
    if (target === "start") startInputRef.current?.focus();
    else endInputRef.current?.focus();
    suppressFocusOpenRef.current = false;
  };

  const handleInputFocus = (target: DateTimeRangeDraftTarget): void => {
    if (!suppressFocusOpenRef.current) openPicker(target, false);
  };

  const restoreOpenedValue = (): void => {
    clearAllDebounces();
    const openedValue = openedValueRef.current;
    draft.reset(openedValue);
    if (!rangesEqual(props.value, openedValue)) {
      props.onChange(openedValue);
    }
  };

  const closeAndDiscard = (): void => {
    restoreOpenedValue();
    setIsOpen(false);
    focusTargetInput(activeTarget);
  };

  const openPicker = (
    target: DateTimeRangeDraftTarget,
    focusPopover: boolean,
  ): void => {
    if (!configuration.canOpen) return;
    if (target === "end" && draft.value.startTimestamp === null) return;
    if (!isOpen) {
      openedValueRef.current = props.value;
      draft.reset(props.value);
    }
    focusPopoverRef.current = focusPopover;
    setActiveTarget(target);
    setIsOpen(true);
  };

  const applyDraft = (): void => {
    clearAllDebounces();
    props.onCommit(draft.value);
    setIsOpen(false);
    focusTargetInput("end");
  };

  const validationDescriptionIds = (
    target: DateTimeRangeDraftTarget,
  ): string =>
    draft.validation.errors
      .filter((error) => error.target === target || error.target === "range")
      .map((error) => `dtrp-${error.target}-${error.code}-error`)
      .join(" ");

  useEffect(() => {
    if (isOpen && focusPopoverRef.current) dialogRef.current?.focus();
    focusPopoverRef.current = false;
  }, [isOpen, activeTarget]);

  useEffect(() => {
    return () => clearAllDebounces();
  }, []);

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

  const endDisabled =
    configuration.disabled || draft.value.startTimestamp === null;
  const inputReadOnly =
    configuration.readOnly || !configuration.textInputEnabled;

  return (
    <div
      ref={rootRef}
      className="dtrp-root"
      data-color-scheme={configuration.colorScheme}
      data-testid={getTestId(configuration.testIds.root, "dtrp-root")}
    >
      <RangeFields
        dialogId={dialogId}
        isOpen={isOpen}
        activeTarget={activeTarget}
        start={draft.start}
        end={draft.end}
        startInputRef={startInputRef}
        endInputRef={endInputRef}
        disabled={configuration.disabled}
        endDisabled={endDisabled}
        readOnly={inputReadOnly}
        canOpen={configuration.canOpen}
        localeText={configuration.localeText}
        testIds={configuration.testIds}
        getDescriptionIds={validationDescriptionIds}
        onFocus={handleInputFocus}
        onChange={changeInput}
        onCommit={commitInput}
        onOpenCalendar={() => {
          const target =
            activeTarget === "end" && draft.value.startTimestamp !== null
              ? "end"
              : "start";
          openPicker(target, true);
        }}
      />
      {isOpen ? (
        <PickerPopover
          configuration={configuration}
          draft={draft}
          activeTarget={activeTarget}
          dialog={{ id: dialogId, label: configuration.localeText.triggerLabel, ref: dialogRef }}
          onReset={restoreOpenedValue}
          onCancel={closeAndDiscard}
          onNext={() => {
            clearAllDebounces();
            setActiveTarget("end");
            focusPopoverRef.current = true;
          }}
          onApply={applyDraft}
        />
      ) : null}
    </div>
  );
}
