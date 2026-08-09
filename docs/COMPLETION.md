# Implementation Completion Log

## Calendar UI (Section 9)

- Added accessible calendar grids for the current and following month.
- Added CSS container-query switching at the documented `40rem` breakpoint.
- Added cross-month pointer range-selection coverage.
- Preserved keyboard month navigation and focus restoration.
- Added a portable `Intl.Locale` week-start boundary for runtimes exposing
  either `weekInfo` or `getWeekInfo()`.

Verification: `npm.cmd run check` (80 tests, typecheck, and build).

## Time and Precision UI (Section 10)

- Added controlled start and end time inputs for hour through millisecond
  precision.
- Applied precision-aware HTML input types and configured minute, second, and
  millisecond steps.
- Reused timezone-aware parsing so edits retain the timestamp contract and
  surface DST validation errors.
- Added component coverage for each time precision.

Verification: focused picker tests (24 tests) and TypeScript typecheck.

## Timezone and Preset UI (Section 11)

- Added a controlled IANA timezone selector with option validation and feature
  visibility support.
- Added a preset region with stable IDs, click-time evaluation, validation,
  and invalid-result rejection.
- Added component coverage for timezone changes and valid/invalid presets.

Verification: focused picker tests (27 tests) and TypeScript typecheck.

## Picker Assembly (Section 12)

- Completed the controlled trigger/popover editing shell and action controls.
- Wired feature visibility, controlled updates, validation, focus restoration,
  cancellation, clearing, and commit gating.
- Added a safe text-input fallback when consumers disable both graphical and
  text editing flags.

Verification: picker component tests and TypeScript typecheck.

## Stable Test IDs (Section 13)

- Added validated fallback handling for empty static and dynamic ID overrides.
- Preserved deterministic defaults for picker controls, calendar cells, time
  controls, presets, and validation output.
- Added regression coverage for partial and empty overrides.

Verification: picker component tests (29 tests) and TypeScript typecheck.

## Styling (Section 14)

- Added a scoped base stylesheet with the complete documented custom-property
  set.
- Added light/dark defaults, focus indicators, range/selected/error/disabled
  states, and responsive calendar layout rules.
- Kept selectors scoped to the picker root and independent of CSS resets.

Verification: full package build and test check.

## Demo Application (Section 15)

- Added a standalone Vite React demo under `demo/`.
- Demonstrated controlled UTC editing, timezone options, precision selection,
  draft-versus-committed values, and a responsive presentation.
- Added `demo` and `demo:build` scripts and excluded generated demo output.

Verification: `npm.cmd run demo:build`.

## Coverage and Documentation (Sections 16, 18, and 20)

- Recorded the configured Vitest/RTL/user-event harness and existing public
  component coverage in the TODO ledger.
- Documented the ARIA dialog/grid, accessible names, and error association
  review covered by the component tests.
- Replaced the scaffold README with install, CSS import, controlled usage,
  timestamp semantics, timezone, precision, and development instructions.

Section 19 (React consumer fixtures) remains explicitly unchecked because it
requires separate React-version installs and fixture execution.

## Browser Workflow (Section 17)

- Added Playwright configuration against a freshly built Vite demo.
- Added a browser smoke test for opening the picker, dialog visibility, and
  calendar/text-input availability.

Verification: `npm.cmd run demo:build`; `npm.cmd run test:e2e` when Chromium is
available in the local Playwright cache.
