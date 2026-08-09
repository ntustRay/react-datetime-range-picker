# Single-Target Date-Time Picker Specification

Status: Approved for implementation on 2026-08-09.

This specification replaces the combined range-editing popover with a
single-target workflow. The controlled value remains a pair of epoch-millisecond
timestamps, but each popover session edits either Start or End.

## Interaction Contract

### Range fields

- The closed control contains separate Start and End text inputs plus one
  calendar button.
- Start and End inputs use human-readable local date-time text rather than
  timestamp numbers.
- The 24-hour format is `YYYY/MM/DD HH:mm:ss`.
- The 12-hour format is `YYYY/MM/DD hh:mm:ss AM`.
- Focusing Start opens the popover with Start as the active target.
- Focusing End opens the popover with End as the active target.
- End remains disabled until Start has a valid value.
- The calendar button reopens the most recently active target; Start is the
  initial target.
- Changing focus between the inputs changes the target without closing the
  popover.

### Debounced text editing

- Input text updates immediately.
- Parsing occurs 300 milliseconds after the final input event.
- Blur and Enter parse immediately without waiting for the debounce.
- Valid text updates the target timestamp and synchronizes the popover.
- Incomplete or invalid text remains visible without replacing the last valid
  timestamp.
- Calendar and time-column changes immediately synchronize the active input.
- `onChange` reports every valid draft value; `onCommit` remains Apply-only.

### Single-target popover

- One popover session displays and edits only the active target.
- The popover always renders exactly one calendar month; previous and next
  controls navigate between months.
- Start selection changes only `startTimestamp`; an existing End is preserved.
- End selection changes only `endTimestamp`; Start is preserved.
- Start dates that would be invalid relative to End are disabled.
- End dates that are not after Start are disabled.
- Minimum, maximum, maximum-duration, step, timezone, and DST constraints still
  apply.
- Choices known to create an invalid range are disabled before selection.

### Time columns

- Each visible unit is a seven-row scroll-snap column.
- The selected row stays centered and has a non-color-only selected state.
- Columns support pointer selection, wheel/scrollbar scrolling, and keyboard
  arrow movement.
- Scrollbars are slim, visible, and themed for light, dark, and forced-colors
  modes.
- Visible columns follow precision:
  - year, month, day: no time columns
  - hour: HH
  - minute: HH, MM
  - second: HH, MM, SS
  - millisecond: HH, MM, SS, SSS
- Minute, second, and millisecond choices respect configured steps.
- The 12-hour mode adds an AM/PM column.

### Footer

The footer is one row at desktop widths and follows this order:

`Reset | Start ~ End | 12/24 | Timezone | Cancel | Next/Apply`

- The range summary is read-only.
- Reset restores both fields to the controlled value captured when the popover
  opened and keeps the current target active.
- Cancel restores the opening value, discards invalid or pending text, closes
  the popover, and returns focus to the active input.
- Start uses Next. Next requires a valid Start, keeps the popover open, and
  changes the target to End.
- End uses Apply. Apply requires a complete valid range, calls `onCommit`, and
  closes the popover.

## Public Interface Additions

```ts
export type HourCycle = "h12" | "h24";

export interface DateTimeRangePickerProps {
  hourCycle?: HourCycle;
  onHourCycleChange?: (hourCycle: HourCycle) => void;
}
```

- The default hour cycle is `h24`.
- Changing hour cycle changes formatting and choices without changing either
  timestamp.
- New visible wording and accessible labels are added to
  `DateTimeRangeLocaleText`; omitted keys use English defaults.
- Stable test IDs cover both inputs, the calendar button, time columns, hour
  cycle, Reset, Cancel, Next, and Apply.

## Visual Direction

The picker is a precision filter tool for chart users. Its visual signature is
the aligned set of scrollable time columns, not decorative chrome.

- Ink `#202124`, muted ink `#68707d`, surface `#ffffff`, muted surface
  `#f6f7fb`, cobalt `#2563eb`, border `#d9dce5`.
- UI text uses Aptos/Segoe UI; numeric date-time data uses Cascadia Code or the
  platform monospace fallback.
- The layout stays quiet and rectangular so column alignment carries the
  hierarchy.

```text
┌──────────────────────┬──────────────────────┬──────┐
│ Start input          │ End input            │ icon │
└──────────────────────┴──────────────────────┴──────┘
┌────────────────────────────────┬───────────────────┐
│ one active-target month        │ HH │ MM │ SS │ …  │
│                                │ scroll-snap lists │
├───────┬──────────────┬─────────┴────┬──────────────┤
│ Reset │ Start ~ End  │ 12/24 │ Zone │ Cancel │ CTA │
└───────┴──────────────┴───────┴──────┴────────┴─────┘
```

Generic card decoration, duplicate target toggles, and a second set of date
inputs inside the popover are explicitly excluded.

## Implementation TODO

- [x] Add HourCycle and callback types to the public interface.
- [x] Add localized Next, hour-cycle, time-column, calendar-button, and Reset
      wording with fallback behavior.
- [x] Add stable test IDs for the split field and time-column controls.
- [x] Extend editable parsing and formatting for slash dates and 12-hour text.
- [x] Add pure single-target date and time transition behavior.
- [x] Add Start and End inputs with 300ms debounce, blur, and Enter parsing.
- [x] Add active-target open, switch, focus-return, Reset, Next, Apply, Cancel,
      Escape, and outside-click behavior.
- [x] Render exactly one month, make selection target-specific, and disable
      invalid choices.
- [x] Replace native time inputs with precision-aware scroll-snap columns.
- [x] Build the single-row responsive footer.
- [x] Update locale demo mappings and public documentation.
- [x] Add unit tests for formatting, parsing, hour cycle, and target transitions.
- [x] Add interaction tests for debounce, target switching, Next, Reset, and
      Apply.
- [x] Add keyboard and accessibility coverage for inputs and time columns.
- [x] Rebuild and inspect desktop, mobile, dark, forced-colors, text-only,
      calendar-only, and precision visual baselines.
- [x] Run typecheck, unit tests, build, demo build, E2E, visual comparison,
      package dry run, and `git diff --check`.
