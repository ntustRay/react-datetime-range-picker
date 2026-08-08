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

- [ ] Draft the public `DateTimeRangeValue` interface.
- [ ] Confirm `startTimestamp` and `endTimestamp` as the public field names.
- [ ] Draft the controlled `timezone` and `onTimezoneChange` props.
- [ ] Draft the `onChange`, `onCommit`, and `onValidationChange` signatures.
- [ ] Define whether callbacks receive a second metadata argument.
- [ ] Define the complete `Precision` string union.
- [ ] Define the complete `Weekday` string union.
- [ ] Define the feature-visibility configuration shape.
- [ ] Define the constraint configuration shape.
- [ ] Define the step configuration shape.
- [ ] Define the preset interface and evaluation callback.
- [ ] Define the stable validation error-code union.
- [ ] Define the validation error object shape.
- [ ] Define the validation result shape.
- [ ] Define the stable test-ID keys and default values.
- [ ] Define the localization-label interface.
- [ ] Decide how consumers customize validation messages.
- [ ] Decide whether the package exports validation helpers publicly.
- [ ] Decide whether the package exports normalization helpers publicly.
- [ ] Record the initial CSS custom-property names.
- [ ] Choose the one-month/two-month container breakpoint.
- [ ] Review all proposed public names before implementation.

### Decision gate

- [ ] Confirm every public field is required unless absence is meaningful.
- [ ] Confirm empty values use `null`, not missing optional fields.
- [ ] Confirm no public API accepts `Date` or seconds-based timestamps.
- [ ] Confirm no first-release feature contradicts [CONTEXT.md](CONTEXT.md).

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

- [ ] Add the `Timestamp` domain alias without unsafe branding assertions.
- [ ] Add `DateTimeRangeValue` with two required nullable fields.
- [ ] Add an internal complete-range type.
- [ ] Add an internal draft-range type if it improves narrowing.
- [ ] Add the `Precision` union.
- [ ] Add the `Weekday` union.
- [ ] Add the display-time-zone type boundary.
- [ ] Add the range-constraint interface.
- [ ] Add the time-step interface.
- [ ] Add the feature-visibility interface.
- [ ] Add the preset interface.
- [ ] Add the localization-label interface.
- [ ] Add the test-ID interface.
- [ ] Add the validation-error-code union.
- [ ] Add the validation-error interface.
- [ ] Add the validation-result interface.
- [ ] Add callback function types.
- [ ] Add the complete controlled component props interface.
- [ ] Export only intentional consumer-facing types from `src/index.ts`.
- [ ] Add compile-time tests for required and nullable fields.
- [ ] Add compile-time tests rejecting `Date` values.
- [ ] Add compile-time tests rejecting seconds-specific configuration.
- [ ] Add compile-time tests for all precision values.
- [ ] Add compile-time tests for all weekday values.

## 3. Develop Precision and Normalization in Vertical Slices

- [ ] Define the ordered precision list in one source of truth.
- [ ] Implement a pure check for whether a unit is visible at a precision.
- [ ] Implement a pure check for units below a precision.
- [ ] Implement UTC normalization for year precision.
- [ ] Implement UTC normalization for month precision.
- [ ] Implement UTC normalization for day precision.
- [ ] Implement UTC normalization for hour precision.
- [ ] Implement UTC normalization for minute precision.
- [ ] Implement UTC normalization for second precision.
- [ ] Implement UTC normalization for millisecond precision.
- [ ] Ensure normalization never infers timestamp units from digit count.
- [ ] Unit-test leap-year normalization.
- [ ] Unit-test month-end normalization.
- [ ] Unit-test negative epoch timestamps.
- [ ] Unit-test timestamps beyond the year 2038.
- [ ] Unit-test every precision boundary.
- [ ] Unit-test that disabled lower units become zero.
- [ ] Unit-test that enabled units remain unchanged.

## 4. Develop Time-Zone Conversion in Vertical Slices

- [ ] Validate IANA time-zone names at the system boundary.
- [ ] Treat UTC as the default when no time zone is supplied.
- [ ] Format an instant into local date-time parts for an IANA time zone.
- [ ] Convert editable local parts into candidate epoch milliseconds.
- [ ] Keep display-time-zone changes from changing the represented instant.
- [ ] Detect nonexistent local times during forward DST transitions.
- [ ] Detect ambiguous local times during backward DST transitions.
- [ ] Return both candidate offsets for ambiguous local times.
- [ ] Define a stable representation for offset choices.
- [ ] Format offsets consistently in the ambiguity UI.
- [ ] Avoid direct `window` or `document` access in time-zone utilities.
- [ ] Unit-test UTC conversion.
- [ ] Unit-test `Asia/Taipei` conversion.
- [ ] Unit-test a negative UTC offset.
- [ ] Unit-test a positive UTC offset.
- [ ] Unit-test a DST spring-forward gap.
- [ ] Unit-test a DST fall-back overlap.
- [ ] Unit-test a zone with a non-hour offset.
- [ ] Unit-test an invalid IANA zone.
- [ ] Verify behavior against modern browser `Intl` implementations.

## 5. Develop Range Validation in Vertical Slices

- [ ] Implement empty-range validation.
- [ ] Implement valid draft-range detection.
- [ ] Reject an end without a start.
- [ ] Reject an end equal to the start.
- [ ] Reject an end before the start.
- [ ] Enforce the optional minimum timestamp.
- [ ] Enforce the optional maximum timestamp.
- [ ] Enforce the optional maximum duration.
- [ ] Validate minute-step alignment.
- [ ] Validate second-step alignment.
- [ ] Validate millisecond-step alignment.
- [ ] Validate required empty ranges.
- [ ] Validate invalid text input.
- [ ] Validate invalid display time zones.
- [ ] Validate nonexistent local times.
- [ ] Require an offset choice for ambiguous local times.
- [ ] Return stable error codes in deterministic order.
- [ ] Associate each error with start, end, range, or time zone.
- [ ] Keep localized text out of validation identity.
- [ ] Unit-test every validation code independently.
- [ ] Unit-test multiple simultaneous errors.
- [ ] Unit-test that optional constraints default to no limit.
- [ ] Unit-test that step values default to integer `1`.
- [ ] Unit-test half-open range semantics.

## 6. Develop the Controlled State Model in Vertical Slices

- [ ] Define the closed-popover state.
- [ ] Define the open-popover draft state.
- [ ] Initialize a draft from the controlled value on open.
- [ ] Preserve a start-only draft.
- [ ] Update the draft without committing it.
- [ ] Emit `onChange` for draft edits.
- [ ] Never emit `onCommit` for incomplete values.
- [ ] Never emit `onCommit` for invalid values.
- [ ] Emit `onCommit` only after Apply.
- [ ] Discard draft edits after Cancel.
- [ ] Discard draft edits after Escape.
- [ ] Define outside-click behavior as Cancel.
- [ ] Clear to two explicit null fields.
- [ ] Sync external controlled updates while closed.
- [ ] Define behavior for external updates while open.
- [ ] Emit validation changes only when the result changes.
- [ ] Avoid side effects during render.
- [ ] Keep state local to the picker.
- [ ] Unit-test every state transition as a pure reducer or model.
- [ ] Unit-test rapid controlled-value updates.

## 7. Develop Text Input in Vertical Slices

- [ ] Define locale-aware display formatting.
- [ ] Define an unambiguous editable text format.
- [ ] Display only units enabled by precision.
- [ ] Implement the start text input.
- [ ] Implement the end text input.
- [ ] Allow temporarily incomplete text while typing.
- [ ] Parse text only at an explicit boundary.
- [ ] Preserve invalid text instead of silently rewriting it.
- [ ] Normalize valid parsed values to precision.
- [ ] Validate parsed values against steps and constraints.
- [ ] Associate errors with the correct input.
- [ ] Support selecting and copying read-only text.
- [ ] Disable editing in disabled mode.
- [ ] Prevent editing in read-only mode.
- [ ] Add visible labels for both inputs.
- [ ] Add accessible descriptions for formatting expectations.
- [ ] Unit-test typing a valid range.
- [ ] Unit-test pasting timestamps represented as text.
- [ ] Unit-test incomplete input.
- [ ] Unit-test malformed input.
- [ ] Unit-test localized display output.

## 8. Develop Calendar Logic in Vertical Slices

- [ ] Generate a calendar month without DOM dependencies.
- [ ] Include leading and trailing days needed for a complete grid.
- [ ] Derive the locale-default first weekday.
- [ ] Apply an explicit weekday-name override.
- [ ] Calculate previous-month navigation.
- [ ] Calculate next-month navigation.
- [ ] Mark the selected start date.
- [ ] Mark the selected end date.
- [ ] Mark dates inside the selected range.
- [ ] Apply half-open visual range semantics consistently.
- [ ] Disable dates before the minimum timestamp.
- [ ] Disable dates after the maximum timestamp.
- [ ] Disable end dates that cannot follow the start.
- [ ] Disable dates that exceed maximum duration.
- [ ] Preserve focus when navigating months.
- [ ] Unit-test months beginning on every weekday.
- [ ] Unit-test February in leap and non-leap years.
- [ ] Unit-test year-boundary navigation.
- [ ] Unit-test locale and override week starts.
- [ ] Unit-test disabled-date calculations.

## 9. Develop Calendar UI in Vertical Slices

- [ ] Render a semantic calendar dialog inside the popover.
- [ ] Render the calendar as an accessible grid.
- [ ] Render weekday headers in locale order.
- [ ] Render previous- and next-month controls.
- [ ] Render one calendar month by default at narrow widths.
- [ ] Render two calendar months at the chosen container breakpoint.
- [ ] Implement the responsive change with CSS container queries.
- [ ] Avoid JavaScript viewport listeners for month count.
- [ ] Add visible start, end, in-range, today, disabled, and focus states.
- [ ] Ensure states are distinguishable without color alone.
- [ ] Support arrow-key movement by day and week.
- [ ] Support Home and End movement within a week.
- [ ] Support Page Up and Page Down month movement.
- [ ] Support Enter and Space selection.
- [ ] Prevent disabled dates from being selected by pointer.
- [ ] Prevent disabled dates from being selected by keyboard.
- [ ] Restore focus predictably after month navigation.
- [ ] Component-test single-month rendering.
- [ ] Component-test two-month rendering.
- [ ] Component-test range selection across months.

## 10. Develop Time and Precision UI in Vertical Slices

- [ ] Render hour input when precision includes hour.
- [ ] Render minute input when precision includes minute.
- [ ] Render second input when precision includes second.
- [ ] Render millisecond input when precision includes millisecond.
- [ ] Hide all time inputs for year, month, and day precision.
- [ ] Apply minute-step choices.
- [ ] Apply second-step choices.
- [ ] Apply millisecond-step choices.
- [ ] Prevent step-mismatched graphical selections.
- [ ] Normalize units below precision after selection.
- [ ] Label start and end time controls distinctly.
- [ ] Support keyboard increment and decrement.
- [ ] Respect min/max constraints at boundary dates.
- [ ] Respect maximum duration while editing the end time.
- [ ] Surface DST gaps as disabled choices.
- [ ] Render both offset choices for a repeated local time.
- [ ] Require the user to resolve an ambiguous time before Apply.
- [ ] Component-test every precision.
- [ ] Component-test custom step values.
- [ ] Component-test DST gap and overlap controls.

## 11. Develop Time-Zone and Preset UI in Vertical Slices

- [ ] Render the time-zone selector when enabled.
- [ ] Hide the time-zone selector when configured off.
- [ ] Keep UTC selected by default.
- [ ] Accept consumer-provided IANA time-zone options.
- [ ] Validate every supplied time-zone option.
- [ ] Emit `onTimezoneChange` without changing timestamps.
- [ ] Re-render displayed local parts after a time-zone change.
- [ ] Preserve the represented instants after a time-zone change.
- [ ] Render no preset region when no presets are supplied.
- [ ] Render consumer-provided preset labels.
- [ ] Evaluate relative presets when clicked, not when rendered.
- [ ] Validate a preset result before updating the draft.
- [ ] Prevent an invalid preset from being committed.
- [ ] Support keyboard activation of presets.
- [ ] Component-test UTC as the default.
- [ ] Component-test time-zone changes.
- [ ] Component-test relative preset evaluation time.
- [ ] Component-test invalid preset results.

## 12. Assemble the Picker through Consumer-Visible Slices

- [ ] Build the closed trigger and range summary.
- [ ] Build the popover container.
- [ ] Add Apply, Cancel, and Clear controls.
- [ ] Show Clear by default.
- [ ] Wire the calendar region visibility setting.
- [ ] Wire the text-input region visibility setting.
- [ ] Wire the time-zone-selector visibility setting.
- [ ] Ensure at least one editing method remains available.
- [ ] Wire controlled values and callbacks.
- [ ] Wire constraints, precision, steps, locale, labels, and presets.
- [ ] Implement disabled behavior.
- [ ] Implement read-only behavior.
- [ ] Implement required behavior.
- [ ] Prevent opening when disabled or read-only.
- [ ] Move focus into the popover when opened.
- [ ] Return focus to the trigger when closed.
- [ ] Cancel and close on Escape.
- [ ] Cancel and close on outside click.
- [ ] Keep Apply disabled for invalid or incomplete drafts.
- [ ] Keep validation messages visible for invalid controlled values.
- [ ] Verify the component remains controlled under rerenders.

## 13. Add Stable Test IDs

- [ ] Define default IDs for the root and trigger.
- [ ] Define default IDs for start and end text inputs.
- [ ] Define default IDs for the popover and calendar dialog.
- [ ] Define default IDs for month navigation.
- [ ] Define default IDs for time controls.
- [ ] Define default IDs for the time-zone selector.
- [ ] Define default IDs for preset controls.
- [ ] Define default IDs for Apply, Cancel, and Clear.
- [ ] Define default IDs for validation messages.
- [ ] Define deterministic IDs for date cells using timestamps.
- [ ] Allow each stable default ID to be overridden.
- [ ] Preserve defaults for keys that are not overridden.
- [ ] Do not provide a way to disable test IDs.
- [ ] Reject empty custom test IDs if they would remove the attribute.
- [ ] Unit-test all default IDs.
- [ ] Unit-test partial overrides.
- [ ] E2E-test selectors using default IDs.
- [ ] E2E-test selectors using overridden IDs.

## 14. Add Styling

- [ ] Create a framework-independent base stylesheet.
- [ ] Export the stylesheet through the package exports map.
- [ ] Define typography custom properties.
- [ ] Define spacing custom properties.
- [ ] Define radius custom properties.
- [ ] Define surface and border custom properties.
- [ ] Define selected-range custom properties.
- [ ] Define focus custom properties.
- [ ] Define error custom properties.
- [ ] Define disabled-state custom properties.
- [ ] Define light-theme defaults.
- [ ] Define dark-theme defaults.
- [ ] Avoid selectors that leak outside the component root.
- [ ] Avoid assumptions about a consumer CSS reset.
- [ ] Provide a clearly visible keyboard focus indicator.
- [ ] Meet AA text and control contrast targets.
- [ ] Ensure error state includes iconography or text, not color alone.
- [ ] Test at narrow container widths.
- [ ] Test at wide container widths.
- [ ] Test long translated labels without clipping.

## 15. Add the Demo Application

- [ ] Create a Vite React demo without turning the repository into a monorepo.
- [ ] Import the package through its public entry point.
- [ ] Add a controlled basic UTC example.
- [ ] Add a `zh-TW` and `Asia/Taipei` example.
- [ ] Add a precision selector example.
- [ ] Add a constraints example.
- [ ] Add a custom steps example.
- [ ] Add a custom presets example.
- [ ] Add a custom labels example.
- [ ] Add a custom test-ID example.
- [ ] Add a disabled example.
- [ ] Add a read-only example.
- [ ] Add a required example.
- [ ] Add an invalid controlled-value example.
- [ ] Add a DST gap example.
- [ ] Add a DST overlap example.
- [ ] Display draft changes separately from committed chart-filter values.
- [ ] Add a lightweight mock chart-filter result panel.
- [ ] Ensure the demo works at narrow and wide widths.
- [ ] Ensure the demo can run as the Playwright test target.

## 16. Expand Unit and Component Coverage Slice by Slice

- [ ] Configure Vitest with a DOM test environment.
- [ ] Configure React Testing Library.
- [ ] Configure user-event.
- [ ] Co-locate tests with their source modules.
- [ ] Confirm each new test fails before its production change is written.
- [ ] Prefer public package or component seams over internal module seams.
- [ ] Use the real internal modules together instead of mocking them.
- [ ] Mock the clock only where relative-time behavior requires determinism.
- [ ] Keep one logical behavior assertion per test.
- [ ] Reject expected values calculated with the same algorithm under test.
- [ ] Add public-export smoke tests.
- [ ] Add controlled-prop synchronization tests.
- [ ] Add callback ordering tests.
- [ ] Add Apply behavior tests.
- [ ] Add Cancel behavior tests.
- [ ] Add Clear behavior tests.
- [ ] Add outside-click behavior tests.
- [ ] Add Escape behavior tests.
- [ ] Add disabled behavior tests.
- [ ] Add read-only behavior tests.
- [ ] Add required behavior tests.
- [ ] Add validation-message association tests.
- [ ] Add locale-label override tests.
- [ ] Add light- and dark-theme class/state tests.
- [ ] Add SSR render smoke tests.
- [ ] Add tests proving no render-time side effects.
- [ ] Add regression tests before fixing every discovered bug.
- [ ] Make test failures readable without implementation knowledge.

## 17. Expand End-to-End Coverage Slice by Slice

- [ ] Configure Playwright against a production demo build.
- [ ] Add each E2E case as the RED step for missing browser-visible behavior.
- [ ] Verify each E2E RED failure comes from missing product behavior.
- [ ] Avoid assertions against React state or implementation details.
- [ ] Install the required browser binaries in CI.
- [ ] Add an E2E test for opening and closing the popover.
- [ ] Add an E2E test for pointer range selection.
- [ ] Add an E2E test for keyboard-only range selection.
- [ ] Add an E2E test for a cross-month range.
- [ ] Add an E2E test for text entry and Apply.
- [ ] Add an E2E test proving invalid text cannot commit.
- [ ] Add an E2E test proving `end <= start` cannot commit.
- [ ] Add an E2E test for minimum timestamp enforcement.
- [ ] Add an E2E test for maximum timestamp enforcement.
- [ ] Add an E2E test for maximum duration enforcement.
- [ ] Add an E2E test for step mismatch validation.
- [ ] Add an E2E test for clearing a range.
- [ ] Add an E2E test for cancelling a draft.
- [ ] Add an E2E test for disabled mode.
- [ ] Add an E2E test for read-only mode.
- [ ] Add an E2E test for required mode.
- [ ] Add an E2E test for a DST gap.
- [ ] Add an E2E test for resolving a DST overlap.
- [ ] Add an E2E test for changing display time zone without changing values.
- [ ] Add an E2E test for default test IDs.
- [ ] Add an E2E test for overridden test IDs.
- [ ] Add an E2E test for focus restoration.
- [ ] Add an E2E test for one- and two-month responsive layouts.
- [ ] Run E2E only after building the current source.

## 18. Verify Accessibility

- [ ] Review the popover against the ARIA dialog pattern.
- [ ] Review the calendar against the ARIA grid pattern.
- [ ] Verify every interactive control has an accessible name.
- [ ] Verify start and end controls are distinguishable to screen readers.
- [ ] Verify errors use `aria-invalid` where appropriate.
- [ ] Verify errors are linked with `aria-describedby`.
- [ ] Verify validation updates are announced appropriately.
- [ ] Verify disabled controls expose the correct semantics.
- [ ] Verify read-only controls expose the correct semantics.
- [ ] Verify no focus trap prevents Escape cancellation.
- [ ] Verify focus order follows visual order.
- [ ] Verify arrow keys do not unexpectedly scroll the page in the calendar.
- [ ] Verify all functionality at 200% zoom.
- [ ] Verify layout at 400% zoom where applicable.
- [ ] Verify light-theme contrast.
- [ ] Verify dark-theme contrast.
- [ ] Verify forced-colors behavior.
- [ ] Test with reduced motion enabled.
- [ ] Perform one manual screen-reader smoke test.
- [ ] Record any accepted accessibility limitation before release.

## 19. Verify Consumer Compatibility

- [ ] Create a clean React 18 consumer fixture.
- [ ] Install the packed tarball into the React 18 fixture.
- [ ] Typecheck and render the React 18 fixture.
- [ ] Create a clean React 19 consumer fixture.
- [ ] Install the packed tarball into the React 19 fixture.
- [ ] Typecheck and render the React 19 fixture.
- [ ] Verify the package in a Vite consumer.
- [ ] Verify the package in an SSR-capable React consumer.
- [ ] Verify CSS can be imported from the documented export.
- [ ] Verify tree shaking removes unused public utilities.
- [ ] Verify no duplicate React copy is installed.
- [ ] Verify package types under `moduleResolution: "bundler"`.
- [ ] Verify package types under `moduleResolution: "nodenext"`.
- [ ] Verify no CommonJS entry is advertised.
- [ ] Verify source maps point to useful sources.
- [ ] Verify the package works without optional polyfills in supported browsers.

## 20. Documentation

- [ ] Replace the README status text when implementation begins.
- [ ] Document installation.
- [ ] Document CSS import requirements.
- [ ] Document the minimal controlled example.
- [ ] Document timestamp millisecond semantics prominently.
- [ ] Document half-open range semantics prominently.
- [ ] Document UTC as the default display time zone.
- [ ] Document time-zone changes as display-only changes.
- [ ] Document every public prop.
- [ ] Document every callback and when it fires.
- [ ] Document draft versus committed ranges.
- [ ] Document every precision value.
- [ ] Document constraints and defaults.
- [ ] Document time steps and defaults.
- [ ] Document presets with a relative-time example.
- [ ] Document localization and custom labels.
- [ ] Document weekday override strings.
- [ ] Document validation error codes.
- [ ] Document default and custom test IDs.
- [ ] Document disabled, read-only, and required behavior.
- [ ] Document DST gap and overlap behavior.
- [ ] Document CSS custom properties.
- [ ] Document light and dark theming.
- [ ] Document supported React and browser versions.
- [ ] Document SSR expectations.
- [ ] Add a migration section before any breaking release.
- [ ] Keep [CONTEXT.md](CONTEXT.md) aligned with domain-language changes.
- [ ] Keep [AGENTS.md](../AGENTS.md) aligned with durable tooling conventions.

## 21. Continuous Integration

- [ ] Add a GitHub Actions CI workflow.
- [ ] Use the supported Node.js LTS version.
- [ ] Install dependencies with `npm ci`.
- [ ] Run formatting or lint checks if configured.
- [ ] Run TypeScript checks.
- [ ] Run unit and component tests.
- [ ] Build the package before E2E tests.
- [ ] Run Playwright E2E tests against the fresh build.
- [ ] Upload Playwright traces only when useful.
- [ ] Run the package-content check.
- [ ] Run consumer-fixture checks.
- [ ] Cache only safe, reproducible dependency data.
- [ ] Cancel obsolete runs on the same branch.
- [ ] Keep the workflow token permissions minimal.
- [ ] Add a status badge only after CI is stable.
- [ ] Require CI before merging once branch protection is enabled.

## 22. Pre-Release Audit

- [ ] Search production code for `any`.
- [ ] Review every type assertion and remove avoidable assertions.
- [ ] Review every optional property for real domain optionality.
- [ ] Review every array iteration for the clearest method.
- [ ] Confirm runtime dependencies remain empty.
- [ ] Confirm React and React DOM remain peer dependencies.
- [ ] Confirm no environment-specific globals run during SSR.
- [ ] Confirm every validation rule has unit coverage.
- [ ] Confirm every critical invalid interaction has E2E coverage.
- [ ] Confirm all supported keyboard paths pass E2E.
- [ ] Confirm DST boundary tests pass in deterministic time zones.
- [ ] Confirm the npm tarball contains only intended files.
- [ ] Confirm the package name is still available under `@ntustray`.
- [ ] Confirm README examples compile against the packed package.
- [ ] Confirm license and copyright text.
- [ ] Run `npm audit` and assess relevant findings.
- [ ] Run the full `check` command from a clean install.
- [ ] Review bundle size and explain any unexpected growth.
- [ ] Review the public exports for accidental API surface.
- [ ] Record known limitations.

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
