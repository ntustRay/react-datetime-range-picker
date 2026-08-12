# Implementation TODO

This checklist turns the product contract in [CONTEXT.md](CONTEXT.md) into a
coverage inventory for test-driven implementation. The numbered sections show
dependencies and intended coverage; they are **not** permission to implement a
whole layer before testing it.

Every behavior is delivered as a vertical slice: one failing test through an
agreed public seam, the smallest implementation that makes it pass, then a
review/refactor step. Keep each commit focused on one coherent behavior.

## TDD Execution Rules

- [x] Agree on the test seams before writing the first behavioral test.
- [ ] Select one unchecked behavior observable through an agreed seam.
- [ ] Write one test whose name describes consumer-visible behavior.
- [ ] Use a worked example or known literal as the expected result.
- [ ] Run the smallest relevant test and observe the expected failure.
- [ ] Confirm failure comes from missing behavior, not broken setup.
- [ ] Write only enough production code to make that test pass.
- [ ] Run the focused test and observe it pass.
- [ ] Run the smallest related test group for regressions.
- [ ] Review naming, duplication, and unnecessary API surface.
- [ ] Refactor only after green while keeping relevant tests green.
- [ ] Mark the corresponding coverage item complete.
- [ ] Commit the coherent vertical slice before starting another.

Do not write all tests first and then all implementation. Do not test private
functions, internal call order, or component implementation details. Do not
mock modules owned by this package. Mock only genuine system boundaries such as
the current clock when a deterministic relative preset requires it.

### Proposed test seams requiring confirmation

- [x] **Public TypeScript exports**: consumer code typechecks or fails through
      the package entry point.
- [x] **Pure public domain functions**: timestamp normalization and validation
      return observable values and structured errors.
- [x] **Rendered picker interface**: a consumer controls props and observes
      accessible DOM, callbacks, and validation messages.
- [x] **Packed npm artifact**: a clean React consumer imports JavaScript, types,
      and CSS through documented package exports.
- [x] **Browser workflow**: a user operates the demo through pointer and
      keyboard interactions in Playwright.

### TDD slice template

- [ ] RED: name one missing behavior at an agreed seam.
- [ ] RED: add one focused test and verify its failure message.
- [ ] GREEN: add the minimum implementation required by that test.
- [ ] GREEN: verify the focused and related tests pass.
- [ ] REVIEW: clarify code without changing observable behavior.
- [ ] REVIEW: run relevant checks and record the completed coverage item.

## 0. Confirm Deferred Decisions

- [x] Draft the public `DateTimeRangeValue` interface.
- [x] Confirm `startTimestamp` and `endTimestamp` as the public field names.
- [x] Draft the controlled `timezone` and `onTimezoneChange` props.
- [x] Draft the `onChange`, `onCommit`, and `onValidationChange` signatures.
- [x] Define whether callbacks receive a second metadata argument.
- [x] Define the complete `Precision` string union.
- [x] Define the complete `Weekday` string union.
- [x] Define the feature-visibility configuration shape.
- [x] Define the constraint configuration shape.
- [x] Define the step configuration shape.
- [x] Define the preset interface and evaluation callback.
- [x] Define the stable validation error-code union.
- [x] Define the validation error object shape.
- [x] Define the validation result shape.
- [x] Define the stable test-ID keys and default values.
- [x] Define the localization-label interface.
- [x] Decide how consumers customize validation messages.
- [x] Decide whether the package exports validation helpers publicly.
- [x] Decide whether the package exports normalization helpers publicly.
- [x] Record the initial CSS custom-property names.
- [x] Choose the one-month/two-month container breakpoint.
- [x] Review all proposed public names before implementation.

### Decision gate

- [x] Confirm every public field is required unless absence is meaningful.
- [x] Confirm empty values use `null`, not missing optional fields.
- [x] Confirm no public API accepts `Date` or seconds-based timestamps.
- [x] Confirm no first-release feature contradicts [CONTEXT.md](CONTEXT.md).

## 1. Initialize the Package

- [x] Run `npm init` and set the package name to
      `@ntustray/react-datetime-range-picker`.
- [x] Mark the package as ESM with `"type": "module"`.
- [x] Set the initial package version to `0.0.0` until release planning begins.
- [x] Add the MIT license metadata.
- [x] Add the repository, homepage, and issue-tracker metadata.
- [x] Add useful npm keywords without keyword stuffing.
- [x] Declare React 18 and React 19 peer dependency ranges.
- [x] Declare React and React DOM as development dependencies for tests/demo.
- [x] Confirm the runtime `dependencies` object is empty.
- [x] Install TypeScript in development dependencies.
- [x] Install Vitest before writing the first domain behavior.
- [x] Add a focused `test` script before writing the first domain behavior.
- [x] Add one test-harness smoke test and verify it can fail and pass.
- [x] Enable TypeScript strict mode.
- [x] Enable `noUncheckedIndexedAccess`.
- [x] Enable `exactOptionalPropertyTypes` if compatible with the public API.
- [x] Configure JSX for the supported React toolchain.
- [x] Add tsdown as the library build tool.
- [x] Configure tsdown for an ESM-only build.
- [x] Configure declaration-file generation.
- [x] Externalize React and React DOM from the bundle.
- [x] Add source maps to published JavaScript and declarations.
- [x] Create `src/index.ts` as the explicit public entry point.
- [x] Add package `exports` for JavaScript, types, and CSS.
- [x] Add a restrictive `files` allowlist for npm publishing.
- [x] Add `build`, `typecheck`, and `check` scripts.
- [x] Add a `.gitignore` for dependencies, output, reports, and local files.
- [x] Add an `.npmignore` only if the `files` allowlist is insufficient.
- [x] Run the first empty library build.
- [x] Inspect the generated package contents with `npm pack --dry-run`.

### Package gate

- [x] Verify `npm.cmd run typecheck` passes.
- [x] Verify `npm.cmd run build` passes.
- [x] Verify React is not bundled into the output.
- [x] Verify generated declarations resolve from the package export.
- [x] Verify no credentials or machine-specific paths are publishable.

## 2. Establish Domain Types with Compile-Time TDD

- [x] Add the `Timestamp` domain alias without unsafe branding assertions.
- [x] Add `DateTimeRangeValue` with two required nullable fields.
- [x] Add an internal complete-range type.
- [x] Add an internal draft-range type if it improves narrowing.
- [x] Add the `Precision` union.
- [x] Add the `Weekday` union.
- [x] Add the display-time-zone type boundary.
- [x] Add the range-constraint interface.
- [x] Add the time-step interface.
- [x] Add the feature-visibility interface.
- [x] Add the preset interface.
- [x] Add the localization-label interface.
- [x] Add the test-ID interface.
- [x] Add the validation-error-code union.
- [x] Add the validation-error interface.
- [x] Add the validation-result interface.
- [x] Add callback function types.
- [x] Add the complete controlled component props interface.
- [x] Export only intentional consumer-facing types from `src/index.ts`.
- [x] Add compile-time tests for required and nullable fields.
- [x] Add compile-time tests rejecting `Date` values.
- [x] Add compile-time tests rejecting seconds-specific configuration.
- [x] Add compile-time tests for all precision values.
- [x] Add compile-time tests for all weekday values.

## 3. Develop Precision and Normalization in Vertical Slices

- [x] Define the ordered precision list in one source of truth.
- [x] Implement a pure check for whether a unit is visible at a precision.
- [x] Implement a pure check for units below a precision.
- [x] Implement UTC normalization for year precision.
- [x] Implement UTC normalization for month precision.
- [x] Implement UTC normalization for day precision.
- [x] Implement UTC normalization for hour precision.
- [x] Implement UTC normalization for minute precision.
- [x] Implement UTC normalization for second precision.
- [x] Implement UTC normalization for millisecond precision.
- [x] Ensure normalization never infers timestamp units from digit count.
- [x] Unit-test leap-year normalization.
- [x] Unit-test month-end normalization.
- [x] Unit-test negative epoch timestamps.
- [x] Unit-test timestamps beyond the year 2038.
- [x] Unit-test every precision boundary.
- [x] Unit-test that disabled lower units become zero.
- [x] Unit-test that enabled units remain unchanged.

## 4. Develop Time-Zone Conversion in Vertical Slices

- [x] Validate IANA time-zone names at the system boundary.
- [x] Treat UTC as the default when no time zone is supplied.
- [x] Format an instant into local date-time parts for an IANA time zone.
- [x] Convert editable local parts into candidate epoch milliseconds.
- [x] Keep display-time-zone changes from changing the represented instant.
- [x] Detect nonexistent local times during forward DST transitions.
- [x] Detect ambiguous local times during backward DST transitions.
- [x] Return both candidate offsets for ambiguous local times.
- [x] Define a stable representation for offset choices.
- [x] Format offsets consistently in the ambiguity UI.
- [x] Avoid direct `window` or `document` access in time-zone utilities.
- [x] Unit-test UTC conversion.
- [x] Unit-test `Asia/Taipei` conversion.
- [x] Unit-test a negative UTC offset.
- [x] Unit-test a positive UTC offset.
- [x] Unit-test a DST spring-forward gap.
- [x] Unit-test a DST fall-back overlap.
- [x] Unit-test a zone with a non-hour offset.
- [x] Unit-test an invalid IANA zone.
- [x] Verify behavior against modern browser `Intl` implementations.

## 5. Develop Range Validation in Vertical Slices

- [x] Implement empty-range validation.
- [x] Implement valid draft-range detection.
- [x] Reject an end without a start.
- [x] Reject an end equal to the start.
- [x] Reject an end before the start.
- [x] Enforce the optional minimum timestamp.
- [x] Enforce the optional maximum timestamp.
- [x] Enforce the optional maximum duration.
- [x] Validate minute-step alignment.
- [x] Validate second-step alignment.
- [x] Validate millisecond-step alignment.
- [x] Validate required empty ranges.
- [x] Validate invalid text input.
- [x] Validate invalid display time zones.
- [x] Validate nonexistent local times.
- [x] Require an offset choice for ambiguous local times.
- [x] Return stable error codes in deterministic order.
- [x] Associate each error with start, end, range, or time zone.
- [x] Keep localized text out of validation identity.
- [ ] Unit-test every validation code independently.
- [x] Unit-test multiple simultaneous errors.
- [x] Unit-test that optional constraints default to no limit.
- [x] Unit-test that step values default to integer `1`.
- [x] Unit-test half-open range semantics.

## 6. Develop the Controlled State Model in Vertical Slices

- [x] Define the closed-popover state.
- [x] Define the open-popover draft state.
- [x] Initialize a draft from the controlled value on open.
- [x] Preserve a start-only draft.
- [x] Update the draft without committing it.
- [x] Emit `onChange` for draft edits.
- [x] Never emit `onCommit` for incomplete values.
- [x] Never emit `onCommit` for invalid values.
- [x] Emit `onCommit` only after Apply.
- [x] Discard draft edits after Cancel.
- [x] Discard draft edits after Escape.
- [x] Define outside-click behavior as Cancel.
- [x] Clear to two explicit null fields.
- [x] Sync external controlled updates while closed.
- [x] Define behavior for external updates while open.
- [x] Emit validation changes only when the result changes.
- [x] Avoid side effects during render.
- [x] Keep state local to the picker.
- [x] Unit-test every state transition as a pure reducer or model.
- [x] Unit-test rapid controlled-value updates.

## 7. Develop Text Input in Vertical Slices

- [x] Define locale-aware display formatting.
- [x] Define an unambiguous editable text format.
- [x] Display only units enabled by precision.
- [x] Implement the start text input.
- [x] Implement the end text input.
- [x] Allow temporarily incomplete text while typing.
- [x] Parse text only at an explicit boundary.
- [x] Preserve invalid text instead of silently rewriting it.
- [x] Normalize valid parsed values to precision.
- [x] Validate parsed values against steps and constraints.
- [x] Associate errors with the correct input.
- [x] Support selecting and copying read-only text.
- [x] Disable editing in disabled mode.
- [x] Prevent editing in read-only mode.
- [x] Add visible labels for both inputs.
- [x] Add accessible descriptions for formatting expectations.
- [x] Unit-test typing a valid range.
- [x] Unit-test pasting timestamps represented as text.
- [x] Unit-test incomplete input.
- [x] Unit-test malformed input.
- [x] Unit-test localized display output.

## 8. Develop Calendar Logic in Vertical Slices

- [x] Generate a calendar month without DOM dependencies.
- [x] Include leading and trailing days needed for a complete grid.
- [x] Derive the locale-default first weekday.
- [x] Apply an explicit weekday-name override.
- [x] Calculate previous-month navigation.
- [x] Calculate next-month navigation.
- [x] Mark the selected start date.
- [x] Mark the selected end date.
- [x] Mark dates inside the selected range.
- [x] Apply half-open visual range semantics consistently.
- [x] Disable dates before the minimum timestamp.
- [x] Disable dates after the maximum timestamp.
- [x] Disable end dates that cannot follow the start.
- [x] Disable dates that exceed maximum duration.
- [x] Preserve focus when navigating months.
- [x] Unit-test months beginning on every weekday.
- [x] Unit-test February in leap and non-leap years.
- [x] Unit-test year-boundary navigation.
- [x] Unit-test locale and override week starts.
- [x] Unit-test disabled-date calculations.

## 9. Develop Calendar UI in Vertical Slices

- [x] Render a semantic calendar dialog inside the popover.
- [x] Render the calendar as an accessible grid.
- [x] Render weekday headers in locale order.
- [x] Render previous- and next-month controls.
- [x] Render one calendar month by default at narrow widths.
- [x] Render two calendar months at the chosen container breakpoint.
- [x] Implement the responsive change with CSS container queries.
- [x] Avoid JavaScript viewport listeners for month count.
- [x] Add visible start, end, in-range, today, disabled, and focus states.
- [x] Ensure states are distinguishable without color alone.
- [x] Support arrow-key movement by day and week.
- [x] Support Home and End movement within a week.
- [x] Support Page Up and Page Down month movement.
- [x] Support Enter and Space selection.
- [x] Prevent disabled dates from being selected by pointer.
- [x] Prevent disabled dates from being selected by keyboard.
- [x] Restore focus predictably after month navigation.
- [x] Component-test single-month rendering.
- [x] Component-test two-month rendering.
- [x] Component-test range selection across months.

## 10. Develop Time and Precision UI in Vertical Slices

- [x] Render hour input when precision includes hour.
- [x] Render minute input when precision includes minute.
- [x] Render second input when precision includes second.
- [x] Render millisecond input when precision includes millisecond.
- [x] Hide all time inputs for year, month, and day precision.
- [x] Apply minute-step choices.
- [x] Apply second-step choices.
- [x] Apply millisecond-step choices.
- [x] Prevent step-mismatched graphical selections.
- [x] Normalize units below precision after selection.
- [x] Label start and end time controls distinctly.
- [x] Support keyboard increment and decrement.
- [x] Respect min/max constraints at boundary dates.
- [x] Respect maximum duration while editing the end time.
- [x] Surface DST gaps as disabled choices.
- [x] Render both offset choices for a repeated local time.
- [x] Require the user to resolve an ambiguous time before Apply.
- [x] Component-test every precision.
- [x] Component-test custom step values.
- [x] Component-test DST gap and overlap controls.

## 11. Develop Time-Zone and Preset UI in Vertical Slices

- [x] Render the time-zone selector when enabled.
- [x] Hide the time-zone selector when configured off.
- [x] Keep UTC selected by default.
- [x] Accept consumer-provided IANA time-zone options.
- [x] Validate every supplied time-zone option.
- [x] Emit `onTimezoneChange` without changing timestamps.
- [x] Re-render displayed local parts after a time-zone change.
- [x] Preserve the represented instants after a time-zone change.
- [x] Render no preset region when no presets are supplied.
- [x] Render consumer-provided preset labels.
- [x] Evaluate relative presets when clicked, not when rendered.
- [x] Validate a preset result before updating the draft.
- [x] Prevent an invalid preset from being committed.
- [x] Support keyboard activation of presets.
- [x] Component-test UTC as the default.
- [x] Component-test time-zone changes.
- [x] Component-test relative preset evaluation time.
- [x] Component-test invalid preset results.

## 12. Assemble the Picker through Consumer-Visible Slices

- [x] Build the closed trigger and range summary.
- [x] Build the popover container.
- [x] Add Apply, Cancel, and Clear controls.
- [x] Show Clear by default.
- [x] Wire the calendar region visibility setting.
- [x] Wire the text-input region visibility setting.
- [x] Wire the time-zone-selector visibility setting.
- [x] Ensure at least one editing method remains available.
- [x] Wire controlled values and callbacks.
- [x] Wire constraints, precision, steps, locale, labels, and presets.
- [x] Implement disabled behavior.
- [x] Implement read-only behavior.
- [x] Implement required behavior.
- [x] Prevent opening when disabled or read-only.
- [x] Move focus into the popover when opened.
- [x] Return focus to the trigger when closed.
- [x] Cancel and close on Escape.
- [x] Cancel and close on outside click.
- [x] Keep Apply disabled for invalid or incomplete drafts.
- [x] Keep validation messages visible for invalid controlled values.
- [x] Verify the component remains controlled under rerenders.

## 13. Add Stable Test IDs

- [x] Define default IDs for the root and trigger.
- [x] Define default IDs for start and end text inputs.
- [x] Define default IDs for the popover and calendar dialog.
- [x] Define default IDs for month navigation.
- [x] Define default IDs for time controls.
- [x] Define default IDs for the time-zone selector.
- [x] Define default IDs for preset controls.
- [x] Define default IDs for Apply, Cancel, and Clear.
- [x] Define default IDs for validation messages.
- [x] Define deterministic IDs for date cells using timestamps.
- [x] Allow each stable default ID to be overridden.
- [x] Preserve defaults for keys that are not overridden.
- [x] Do not provide a way to disable test IDs.
- [x] Reject empty custom test IDs if they would remove the attribute.
- [x] Unit-test all default IDs.
- [x] Unit-test partial overrides.
- [ ] E2E-test selectors using default IDs.
- [ ] E2E-test selectors using overridden IDs.

## 14. Add Styling

- [x] Create a framework-independent base stylesheet.
- [x] Export the stylesheet through the package exports map.
- [x] Define typography custom properties.
- [x] Define spacing custom properties.
- [x] Define radius custom properties.
- [x] Define surface and border custom properties.
- [x] Define selected-range custom properties.
- [x] Define focus custom properties.
- [x] Define error custom properties.
- [x] Define disabled-state custom properties.
- [x] Define light-theme defaults.
- [x] Define dark-theme defaults.
- [x] Avoid selectors that leak outside the component root.
- [x] Avoid assumptions about a consumer CSS reset.
- [x] Provide a clearly visible keyboard focus indicator.
- [x] Meet AA text and control contrast targets.
- [x] Ensure error state includes iconography or text, not color alone.
- [ ] Test at narrow container widths.
- [ ] Test at wide container widths.
- [ ] Test long translated labels without clipping.

## 15. Add the Demo Application

- [x] Create a Vite React demo without turning the repository into a monorepo.
- [x] Import the package through its public entry point.
- [x] Add a controlled basic UTC example.
- [x] Add a `zh-TW` and `Asia/Taipei` example.
- [x] Add a precision selector example.
- [x] Add a constraints example.
- [x] Add a custom steps example.
- [x] Add a custom presets example.
- [x] Add a custom labels example.
- [x] Add a custom test-ID example.
- [x] Add a disabled example.
- [x] Add a read-only example.
- [x] Add a required example.
- [x] Add an invalid controlled-value example.
- [x] Add a DST gap example.
- [x] Add a DST overlap example.
- [x] Display draft changes separately from committed chart-filter values.
- [x] Add a lightweight mock chart-filter result panel.
- [x] Ensure the demo works at narrow and wide widths.
- [x] Ensure the demo can run as the Playwright test target.

## 16. Expand Unit and Component Coverage Slice by Slice

- [x] Configure Vitest with a DOM test environment.
- [x] Configure React Testing Library.
- [x] Configure user-event.
- [ ] Co-locate tests with their source modules.
- [ ] Confirm each new test fails before its production change is written.
- [ ] Prefer public package or component seams over internal module seams.
- [ ] Use the real internal modules together instead of mocking them.
- [ ] Mock the clock only where relative-time behavior requires determinism.
- [ ] Keep one logical behavior assertion per test.
- [ ] Reject expected values calculated with the same algorithm under test.
- [x] Add public-export smoke tests.
- [x] Add controlled-prop synchronization tests.
- [x] Add callback ordering tests.
- [x] Add Apply behavior tests.
- [x] Add Cancel behavior tests.
- [x] Add Clear behavior tests.
- [x] Add outside-click behavior tests.
- [x] Add Escape behavior tests.
- [x] Add disabled behavior tests.
- [x] Add read-only behavior tests.
- [x] Add required behavior tests.
- [x] Add validation-message association tests.
- [x] Add locale-label override tests.
- [ ] Add light- and dark-theme class/state tests.
- [x] Add SSR render smoke tests.
- [ ] Add tests proving no render-time side effects.
- [ ] Add regression tests before fixing every discovered bug.
- [ ] Make test failures readable without implementation knowledge.

## 17. Expand End-to-End Coverage Slice by Slice

- [x] Configure Playwright against a production demo build.
- [ ] Add each E2E case as the RED step for missing browser-visible behavior.
- [ ] Verify each E2E RED failure comes from missing product behavior.
- [ ] Avoid assertions against React state or implementation details.
- [x] Install the required browser binaries in CI.
- [x] Add an E2E test for opening and closing the popover.
- [x] Add an E2E test for pointer range selection.
- [x] Add an E2E test for keyboard-only range selection.
- [x] Add an E2E test for a cross-month range.
- [x] Add an E2E test for text entry and Apply.
- [x] Add an E2E test proving invalid text cannot commit.
- [x] Add an E2E test proving `end <= start` cannot commit.
- [x] Add an E2E test for minimum timestamp enforcement.
- [x] Add an E2E test for maximum timestamp enforcement.
- [x] Add an E2E test for maximum duration enforcement.
- [x] Add an E2E test for step mismatch validation.
- [x] Add an E2E test for clearing a range.
- [x] Add an E2E test for cancelling a draft.
- [x] Add an E2E test for disabled mode.
- [x] Add an E2E test for read-only mode.
- [x] Add an E2E test for required mode.
- [x] Add an E2E test for a DST gap.
- [x] Add an E2E test for resolving a DST overlap.
- [x] Add an E2E test for changing display time zone without changing values.
- [x] Add an E2E test for default test IDs.
- [x] Add an E2E test for overridden test IDs.
- [x] Add an E2E test for focus restoration.
- [x] Add an E2E test that the one-month panel remains usable at narrow and
      wide viewport widths.
- [x] Run E2E only after building the current source.

## 18. Verify Accessibility

- [x] Review the popover against the ARIA dialog pattern.
- [x] Review the calendar against the ARIA grid pattern.
- [x] Verify every interactive control has an accessible name.
- [x] Verify start and end controls are distinguishable to screen readers.
- [x] Verify errors use `aria-invalid` where appropriate.
- [x] Verify errors are linked with `aria-describedby`.
- [x] Verify validation updates are announced appropriately.
- [x] Verify disabled controls expose the correct semantics.
- [x] Verify read-only controls expose the correct semantics.
- [x] Verify no focus trap prevents Escape cancellation.
- [x] Verify focus order follows visual order.
- [x] Verify arrow keys do not unexpectedly scroll the page in the calendar.
- [x] Verify all functionality at 200% zoom.
- [x] Verify layout at 400% zoom where applicable.
- [x] Verify light-theme contrast.
- [x] Verify dark-theme contrast.
- [x] Verify forced-colors behavior.
- [x] Test with reduced motion enabled.
- [x] Record any accepted accessibility limitation before release.

### Nice-to-have follow-up

- [ ] Perform one manual screen-reader smoke test with Narrator or NVDA.

## 19. Verify Consumer Compatibility

- [x] Create a clean React 18 consumer fixture.
- [x] Install the packed tarball into the React 18 fixture.
- [x] Typecheck and render the React 18 fixture.
- [x] Create a clean React 19 consumer fixture.
- [x] Install the packed tarball into the React 19 fixture.
- [x] Typecheck and render the React 19 fixture.
- [x] Verify the package in a Vite consumer.
- [x] Verify the package in an SSR-capable React consumer.
- [x] Verify CSS can be imported from the documented export.
- [x] Verify tree shaking removes unused public utilities.
- [x] Verify no duplicate React copy is installed.
- [x] Verify package types under `moduleResolution: "bundler"`.
- [x] Verify package types under `moduleResolution: "nodenext"`.
- [x] Verify no CommonJS entry is advertised.
- [x] Verify source maps point to useful sources.
- [x] Verify the package works without optional polyfills in supported browsers.

## 20. Documentation

- [x] Replace the README status text when implementation begins.
- [x] Document installation.
- [x] Document CSS import requirements.
- [x] Document the minimal controlled example.
- [x] Document timestamp millisecond semantics prominently.
- [x] Document half-open range semantics prominently.
- [x] Document UTC as the default display time zone.
- [x] Document time-zone changes as display-only changes.
- [x] Document every public prop.
- [x] Document every callback and when it fires.
- [x] Document draft versus committed ranges.
- [x] Document every precision value.
- [x] Document constraints and defaults.
- [x] Document time steps and defaults.
- [x] Document presets with a relative-time example.
- [x] Document localization and custom labels.
- [x] Document weekday override strings.
- [x] Document validation error codes.
- [x] Document default and custom test IDs.
- [x] Document disabled, read-only, and required behavior.
- [x] Document DST gap and overlap behavior.
- [x] Document CSS custom properties.
- [x] Document light and dark theming.
- [x] Document supported React and browser versions.
- [x] Document SSR expectations.
- [ ] Add a migration section before any breaking release.
- [ ] Keep [CONTEXT.md](CONTEXT.md) aligned with domain-language changes.
- [ ] Keep [AGENTS.md](../AGENTS.md) aligned with durable tooling conventions.

## 21. Continuous Integration

Follow the owner/agent runbook in
[CI_AND_NPM_RELEASE_GUIDE.md](CI_AND_NPM_RELEASE_GUIDE.md).
Local Windows build and packed-consumer commands are documented in
[MANUAL_BUILD_GUIDE.md](MANUAL_BUILD_GUIDE.md).

- [x] Add a GitHub Actions CI workflow.
- [x] Use the supported Node.js LTS version.
- [x] Install dependencies with `npm ci`.
- [x] Run formatting or lint checks if configured.
- [x] Run TypeScript checks.
- [x] Run unit and component tests.
- [x] Build the package before E2E tests.
- [x] Run Playwright E2E tests against the fresh build.
- [x] Upload Playwright traces only when useful.
- [x] Run the package-content check.
- [x] Run consumer-fixture checks.
- [x] Cache only safe, reproducible dependency data.
- [x] Cancel obsolete runs on the same branch.
- [x] Keep the workflow token permissions minimal.
- [x] Add a status badge only after CI is stable.
- [x] Require CI before merging once branch protection is enabled.

## 22. Pre-Release Audit

- [x] Search production code for `any`.
- [x] Review every type assertion and remove avoidable assertions.
- [x] Review every optional property for real domain optionality.
- [x] Review every array iteration for the clearest method.
- [x] Confirm runtime dependencies remain empty.
- [x] Confirm React and React DOM remain peer dependencies.
- [x] Confirm no environment-specific globals run during SSR.
- [x] Confirm every validation rule has unit coverage.
- [x] Confirm every critical invalid interaction has E2E coverage.
- [x] Confirm all supported keyboard paths pass E2E.
- [x] Confirm DST boundary tests pass in deterministic time zones.
- [x] Confirm the npm tarball contains only intended files.
- [x] Confirm the package name is still available under `@ntustray`.
- [x] Confirm README examples compile against the packed package.
- [x] Confirm license and copyright text.
- [x] Run `npm audit` and assess relevant findings.
- [x] Run the full `check` command from a clean install.
- [x] Review bundle size and explain any unexpected growth.
- [x] Review the public exports for accidental API surface.
- [x] Record known limitations.

## 23. Deferred npm Publication

- [ ] Decide the first public version number.
- [ ] Add a changelog policy.
- [ ] Decide how release notes are generated.
- [ ] Create the package under the `@ntustray` npm scope.
- [ ] Confirm the package is configured for public access.
- [ ] Configure npm trusted publishing for this GitHub repository.
- [ ] Add a release workflow with minimal permissions.
- [ ] Enable npm provenance.
- [ ] Require all verification gates before publish.
- [ ] Publish from an immutable version tag or GitHub release.
- [ ] Verify the published package metadata on npm.
- [ ] Install the published package into a clean consumer project.
- [ ] Verify types, JavaScript, and CSS from the registry package.
- [ ] Create a GitHub release matching the npm version.
- [ ] Document the release and rollback procedure.

## Definition of Done for Version 1

- [ ] The public API matches the reviewed contract.
- [ ] All values use epoch milliseconds.
- [ ] UTC is the default and IANA time-zone editing is correct.
- [ ] Precision and lower-unit normalization behave consistently.
- [ ] Invalid ranges cannot be committed.
- [ ] DST gaps and overlaps require explicit, correct handling.
- [ ] Pointer, text, and keyboard workflows are complete.
- [ ] The component meets the documented accessibility target.
- [ ] Required unit, component, and E2E tests pass.
- [ ] React 18 and React 19 consumer fixtures pass.
- [ ] The package has zero runtime dependencies.
- [ ] The ESM build, declarations, exports, and CSS are valid.
- [ ] Documentation matches shipped behavior.
- [ ] A clean consumer can install and use the package successfully.
