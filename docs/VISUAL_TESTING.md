# Visual regression workflow

`visual/snapshots/github-windows/` is the authoritative baseline used by both
CI and release. The runner family is `windows-2025`; Node comes from
`.node-version`, npm from `packageManager`, and Playwright/browser revisions
from `package-lock.json`. A contributor workstation is not a release prerequisite.
Older PNGs directly under `visual/snapshots/` are historical references and
are no longer selected by the configuration.

The 21 scenarios cover desktop/mobile pages, open/selected/error picker states,
light/dark/forced colors, precision, feature modes, constrained presets, and
New York DST gap/overlap validation. Captures use the bundled Chromium,
`en-US` browser locale, UTC browser timezone, light color scheme, reduced
motion, a fixed clock (`2026-08-09T00:00:00Z`), and `document.fonts.ready`.
Pointer hover is cleared before picker captures. Existing component/demo font
stacks are unchanged; runner image versions and Segoe UI/Consolas font hashes
are recorded in `browser-environment.txt` to diagnose renderer drift.

## Inspect evidence for a candidate SHA

1. Open that commit's **Browser and Visual** job (or the matching release job).
2. Download `playwright-<SHA>-<attempt>` (release artifacts add `release-`).
3. Open `playwright-report/e2e/index.html` and
   `playwright-report/visual/index.html`. Separate directories prevent the
   visual run from overwriting the E2E report.
4. Inspect current screenshots in `test-results/e2e/` and
   `test-results/visual/`. On failure, inspect expected/actual/diff attachments
   and the retained trace; compare `browser-environment.txt` before assuming
   a product regression.

Reports and screenshots are uploaded on successful and failed runs and retained
for seven days. Visual comparisons still run after a failed E2E suite when the
browser installation succeeded; that never turns an E2E failure into a pass.

## Update only reviewed differences

Run `npm run build` before browser verification. `npm run test:visual` compares
against the hosted baseline even outside Actions; other operating systems can
render differently and must not replace those PNGs with local output.

On an intentional UI change:

1. Run the candidate in Actions and inspect the original actual/diff images.
2. Check desktop/mobile/error/theme/DST rendering affected by the change.
3. Copy only reviewed actual images from the hosted artifact to the matching
   baseline filenames, or explicitly run `npm run test:visual:update` in the
   matching renderer after reviewing the original failure.
4. Commit only intentional changed baselines with the implementation.
5. Run exact comparisons again on the new commit and confirm all required
   checks pass before tagging.

CI never runs `--update-snapshots` automatically, and no tolerance is increased
to hide a failure. If no visible pixels changed, preserve the existing PNGs.
Use `npm run test:e2e` separately to verify browser-visible interactions.
