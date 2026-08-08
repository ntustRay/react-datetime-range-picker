import { useEffect, useRef, useState } from "react";

import type { DateTimeRangePickerProps } from "./types.js";
import { validateDateTimeRange } from "./validate-date-time-range.js";

const DEFAULT_TRIGGER_LABEL = "Select date and time range";
const EMPTY_RANGE = { startTimestamp: null, endTimestamp: null };

export function DateTimeRangePicker(
  props: DateTimeRangePickerProps,
): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(props.value);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const validationSignatureRef = useRef<string | null>(null);

  const validation = validateDateTimeRange(draft, {
    ...(props.constraints === undefined ? {} : { constraints: props.constraints }),
    ...(props.steps === undefined ? {} : { steps: props.steps }),
    ...(props.required === undefined ? {} : { required: props.required }),
    ...(props.timezone === undefined ? {} : { timezone: props.timezone }),
  });
  const validationSignature = JSON.stringify(validation);

  const closeAndDiscard = (): void => {
    setDraft(props.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setDraft(props.value);
  }, [props.value.startTimestamp, props.value.endTimestamp]);

  useEffect(() => {
    if (
      props.onValidationChange !== undefined &&
      validationSignatureRef.current !== validationSignature
    ) {
      validationSignatureRef.current = validationSignature;
      props.onValidationChange(validation);
    }
  }, [props.onValidationChange, validation, validationSignature]);

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
  }, [isOpen, props.value.startTimestamp, props.value.endTimestamp]);

  const triggerLabel = props.labels?.trigger ?? DEFAULT_TRIGGER_LABEL;
  const applyLabel = props.labels?.apply ?? "Apply";
  const cancelLabel = props.labels?.cancel ?? "Cancel";
  const clearLabel = props.labels?.clear ?? "Clear";

  const updateDraft = (value: typeof draft): void => {
    setDraft(value);
    props.onChange(value);
  };

  return (
    <div ref={rootRef} data-testid={props.testIds?.root ?? "dtrp-root"}>
      <button
        ref={triggerRef}
        type="button"
        data-testid={props.testIds?.trigger ?? "dtrp-trigger"}
        disabled={props.disabled === true || props.readOnly === true}
        onClick={() => {
          setDraft(props.value);
          setIsOpen(true);
        }}
      >
        {triggerLabel}
      </button>
      {isOpen ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label={triggerLabel}
          tabIndex={-1}
          data-testid={props.testIds?.popover ?? "dtrp-popover"}
        >
          {props.presets?.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={
                props.testIds?.preset?.(preset.id) ?? `dtrp-preset-${preset.id}`
              }
              onClick={() =>
                updateDraft(
                  preset.getValue({
                    nowTimestamp: Date.now(),
                    timezone: props.timezone ?? "UTC",
                    precision: props.precision ?? "second",
                  }),
                )
              }
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            data-testid={props.testIds?.apply ?? "dtrp-apply"}
            disabled={validation.status !== "complete"}
            onClick={() => {
              props.onCommit(draft);
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
          >
            {applyLabel}
          </button>
          <button
            type="button"
            data-testid={props.testIds?.cancel ?? "dtrp-cancel"}
            onClick={closeAndDiscard}
          >
            {cancelLabel}
          </button>
          {props.clearable !== false ? (
            <button
              type="button"
              data-testid={props.testIds?.clear ?? "dtrp-clear"}
              onClick={() => updateDraft(EMPTY_RANGE)}
            >
              {clearLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
