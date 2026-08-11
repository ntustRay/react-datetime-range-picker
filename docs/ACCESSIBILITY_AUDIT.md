# Accessibility Audit

Audit date: 2026-08-11

This audit covers the first-release picker against the accessibility checks in
[TODO.md](TODO.md). Automated checks use Chromium and the production demo.

## Verified behavior

- The popover and calendar follow the documented dialog and grid patterns, and
  all interactive controls have accessible names.
- Validation messages are linked to their fields. The polite, atomic live
  region now exists before an error appears so assistive technology can observe
  later content updates reliably.
- Disabled inputs and triggers use native `disabled` semantics. Read-only text
  inputs use native `readonly`, and their calendar trigger is disabled.
- Keyboard users can leave the popover with Escape, follow the visual control
  order with Tab, and move through calendar grids without scrolling the page.
- Equivalent 200% and 400% reflow viewports retain the complete picker width
  without horizontal overflow, and date selection remains usable.
- Forced-colors rendering preserves selected and in-range boundaries. Reduced
  motion removes the popover entrance animation.
- Reviewed light-theme contrast ratios range from 5.00:1 for muted text to
  17.57:1 for primary text. Reviewed dark-theme ratios range from 7.04:1 for
  error text to 14.98:1 for primary text. Selected text is 5.17:1 in light mode
  and 7.69:1 in dark mode.

## Evidence

- `npm run test`: 95 unit and component tests.
- `npm run test:e2e`: 29 browser workflow tests.
- `npm run test:visual`: 20 exact screenshot comparisons, including desktop,
  mobile, dark, and forced-colors states.
- Desktop, mobile, dark, and forced-colors baselines were visually inspected
  during this audit; no clipping, unintended horizontal overflow, or ambiguous
  selected state was found.

## Nice-to-have follow-up

When practical, run one smoke test with Narrator, NVDA, or another supported
screen reader. Confirm the dialog name, active range target, month changes,
selected-date status, validation updates, and focus restoration are announced
understandably. This requires audio and human interpretation, so automated DOM
and browser checks do not mark it complete.

The owner has classified this manual smoke test as a nice-to-have follow-up, not
a first-release blocker. No accessibility limitation has otherwise been
accepted for the first release.
