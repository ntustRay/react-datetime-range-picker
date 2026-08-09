# Visual regression workflow

The committed images in `visual/snapshots/` are the durable visual baseline for
the demo. They cover the full page and the open picker at desktop and mobile
widths. The browser clock is fixed so the calendar does not drift with the
current date.

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
