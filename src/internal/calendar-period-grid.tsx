import { useEffect, useRef, useState } from "react";

interface CalendarPeriodOption {
  value: number;
  label: string;
  selected: boolean;
  disabled: boolean;
}

interface CalendarPeriodGridProps {
  label: string;
  options: readonly CalendarPeriodOption[];
  columns: number;
  onSelect: (value: number) => void;
  onChangePage: (offset: -1 | 1) => void;
  onExit: () => void;
}

function getInitialIndex(options: readonly CalendarPeriodOption[]): number {
  const selectedIndex = options.findIndex(
    (option) => option.selected && !option.disabled,
  );
  if (selectedIndex >= 0) return selectedIndex;
  return Math.max(
    0,
    options.findIndex((option) => !option.disabled),
  );
}

function getEnabledIndex(
  options: readonly CalendarPeriodOption[],
  startIndex: number,
  step: number,
): number {
  let index = startIndex;
  while (index >= 0 && index < options.length) {
    if (!options[index]?.disabled) return index;
    index += step;
  }
  return Math.max(0, Math.min(options.length - 1, startIndex - step));
}

export function CalendarPeriodGrid(
  props: CalendarPeriodGridProps,
): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState(() =>
    getInitialIndex(props.options),
  );
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rows: CalendarPeriodOption[][] = [];

  for (let index = 0; index < props.options.length; index += props.columns) {
    rows.push(props.options.slice(index, index + props.columns));
  }

  useEffect(() => {
    buttonRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const focusIndex = (candidate: number, step: number): void => {
    const nextIndex = getEnabledIndex(props.options, candidate, step);
    setActiveIndex(nextIndex);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onExit();
      return;
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      props.onChangePage(event.key === "PageUp" ? -1 : 1);
      return;
    }

    let candidate = activeIndex;
    let step = 1;
    if (event.key === "ArrowLeft") {
      candidate -= 1;
      step = -1;
    } else if (event.key === "ArrowRight") {
      candidate += 1;
    } else if (event.key === "ArrowUp") {
      candidate -= props.columns;
      step = -1;
    } else if (event.key === "ArrowDown") {
      candidate += props.columns;
      step = props.columns;
    } else if (event.key === "Home") {
      candidate = 0;
    } else if (event.key === "End") {
      candidate = props.options.length - 1;
      step = -1;
    } else {
      return;
    }

    event.preventDefault();
    focusIndex(candidate, step);
  };

  return (
    <div className="dtrp-period-grid" role="grid" aria-label={props.label}>
      {rows.map((row, rowIndex) => {
        const firstOption = row[0];
        if (firstOption === undefined) return null;
        return (
          <div key={firstOption.value} role="row">
            {row.map((option, columnIndex) => {
              const index = rowIndex * props.columns + columnIndex;
              return (
                <button
                  key={option.value}
                  ref={(element) => {
                    buttonRefs.current[index] = element;
                  }}
                  type="button"
                  role="gridcell"
                  aria-selected={option.selected}
                  tabIndex={index === activeIndex ? 0 : -1}
                  disabled={option.disabled}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={handleKeyDown}
                  onClick={() => props.onSelect(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export type { CalendarPeriodOption };
