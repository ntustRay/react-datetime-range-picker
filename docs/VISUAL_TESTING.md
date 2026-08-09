# Visual regression workflow

The committed images in `visual/snapshots/` are the durable visual baseline for
the demo. They cover the full page, empty and populated picker states at desktop
and mobile widths, light/dark/high-contrast rendering, feature modes,
constraints, presets, invalid ranges, and DST validation. The browser clock is
fixed so the calendar does not drift with the current date. Tests move the
pointer away before capture so accidental hover states do not enter a baseline.
Open-state baselines capture the complete floating popover directly, including
the day, month, and year calendar views.

After a UI change:

1. Run `npm run test:visual` to compare the current rendering with the baseline.
2. Open and inspect the generated diff in `test-results/` when a comparison
   fails. Do not judge the change from the numeric pixel count alone.
3. If the change is intentional, run `npm run test:visual:update`.
4. Open the updated PNG files in `visual/snapshots/` and review them yourself.
5. Commit the screenshots with the related UI change.

Use `npm run test:e2e` separately for interaction behavior. Visual tests answer
whether the interface changed; E2E tests answer whether the workflow still
works.
