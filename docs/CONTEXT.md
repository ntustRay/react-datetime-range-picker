# Date-Time Range Selection Context

This document defines the product language and behavioral contract for a React
date-time range picker used primarily to filter timestamp-based chart data.

## Language

**Timestamp**:
A Unix epoch value expressed exclusively in milliseconds.
_Avoid_: Date object, seconds timestamp

**Range Value**:
A controlled value containing `startTimestamp` and `endTimestamp`, each of
which is a timestamp or `null`.
_Avoid_: Date range, tuple

**Complete Range**:
A range whose start and end are both present and whose end is strictly after
its start.
_Avoid_: Closed range

**Draft Range**:
An in-progress range that may contain a start without an end. A range with an
end but no start is invalid, not a draft.
_Avoid_: Partial value

**Committed Range**:
A complete, valid range explicitly accepted by the user. Chart queries should
react to committed ranges rather than every draft edit.
_Avoid_: Submitted range

**Precision**:
The smallest editable unit, selected from year, month, day, hour, minute,
second, or millisecond. Units are continuous from year through the configured
precision; the default is second.
_Avoid_: Arbitrary field toggles, granularity

**Display Time Zone**:
The controlled IANA time zone used to display and edit a timestamp. Changing it
does not change the instant represented by the timestamp; the default is UTC.
_Avoid_: Timestamp time zone, fixed offset

**Preset**:
A consumer-provided shortcut that calculates a range when selected. Relative
presets calculate against the current time at the moment of selection.
_Avoid_: Built-in range

## Range Contract

- Ranges use half-open semantics: `startTimestamp <= timestamp < endTimestamp`.
- Input, change, and commit values all use epoch milliseconds.
- Clearing produces `{ startTimestamp: null, endTimestamp: null }`.
- Selecting a start may produce a draft with a null end.
- A committed range must be complete and valid.
- Units below the configured precision normalize to zero. For example, second
  precision normalizes milliseconds to zero.
- Optional minimum timestamp, maximum timestamp, and maximum duration
  constraints default to no limit.
- Optional minute, second, and millisecond steps default to integer `1`.

## Interaction Contract

- The picker is controlled and exposes distinct change, commit, time-zone
  change, and validation notifications.
- Draft changes do not trigger a committed chart query.
- Apply commits only a complete, valid range; Cancel discards the draft.
- Clear is shown by default and produces an empty range.
- Calendar, text input, and time-zone selector regions can be configured.
- Time fields are determined by precision rather than a separate visibility
  switch.
- The popover displays two months when its CSS container has enough width and
  one month when it does not.
- The first weekday follows the locale by default and can be overridden with a
  weekday name such as `"monday"`.
- Locale defaults to English and can be set to a BCP 47 language tag such as
  `"zh-TW"`.
- `locale` controls date formatting and locale-derived weekdays only.
- `localeText` independently replaces visible wording, accessible names, range
  statuses, and validation messages; omitted keys use English defaults.

## Validation Contract

- Choices known to create an invalid range are disabled in the graphical UI.
- Invalid controlled values and invalid text remain visible with an explicit
  error state and message; the component does not silently rewrite them.
- Invalid or incomplete values never produce a commit.
- Structured validation errors use stable codes rather than localized text as
  identifiers.
- A nonexistent local time caused by a daylight-saving transition is disabled
  or rejected.
- An ambiguous repeated local time requires an explicit UTC-offset choice.
- Validation behavior requires both unit-test and end-to-end coverage.

## Accessibility and Test Contract

- The component targets WCAG 2.2 AA and supports complete keyboard operation.
- Focus moves into the popover when opened and returns to its trigger when
  closed; Escape cancels and closes it.
- State is never communicated by color alone, and errors are associated with
  their fields through accessible descriptions.
- Stable `data-testid` attributes are present by default and cannot be
  disabled. Consumers may override their values.
- Disabled, read-only, required, validation, and keyboard behaviors are part of
  the release test suite.

## Product Boundaries

- The first release provides one complete date-time range picker, not headless
  hooks or a low-level component system.
- The first release uses a popover, not inline or modal presentation.
- Native HTML form serialization is outside the first-release scope; consumers
  integrate through controlled React callbacks.
- No presets are built in; consumers supply presets appropriate to their
  domain.
- The component provides framework-independent base CSS with custom properties
  and supports light and dark presentation.
- Runtime dependencies are avoided. React and React DOM are peer dependencies.
- Modern Chrome, Edge, Firefox, and Safari are supported; Internet Explorer is
  not.
- Rendering is safe in server-side React environments.

## Public API Decisions

The initial public names, configuration shapes, validation identifiers, test
IDs, CSS custom properties, and responsive breakpoint are fixed in
[PUBLIC_API.md](PUBLIC_API.md).

## Deferred Decisions

- npm publishing and GitHub trusted-publishing automation
