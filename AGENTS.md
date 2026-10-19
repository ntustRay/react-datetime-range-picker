# React DateTime Range Picker Agent Notes

## Project Goal

Build a reusable, accessible React date-time range picker component library.

## Current Tooling

- Use the Node version in `.node-version`, npm `11.17.0` from
  `packageManager`, and `npm ci` with the committed lockfile.
- Use TypeScript in strict mode with `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`.
- Use Vitest for unit tests and tsdown for the ESM library build.
- Keep React and React DOM as peer dependencies and avoid runtime dependencies.
- Import package CSS through `@ntustray/react-datetime-range-picker/styles.css`.

## Working Rules

- Apply the coding rules supplied with the active task; no machine-specific
  parent path is a prerequisite.
- Inspect the repository before making changes.
- Keep changes small and limited to the requested task.
- Prefer controlled React components and explicit domain types.
- Treat accessibility, keyboard navigation, timezone behavior, and range
  validation as core product behavior.
- Keep date calculations separate from rendering so they can be tested without
  the DOM.
- Do not add dependencies or abstractions for hypothetical future needs.
- Update this file when durable project conventions are established.

## Verification

Use the smallest relevant checks configured in `package.json`. If tooling has
not been selected yet, state that clearly rather than inventing commands.

For UI changes, run `npm run test:visual`, inspect the rendered desktop and
mobile screenshots yourself, and compare them with the committed baselines.
Update baselines with `npm run test:visual:update` only after confirming that
the visual differences are intentional. Keep the baseline images committed so
future UI work has durable before-and-after evidence.

## Browser Evidence

- CI and release use the same `windows-2025` runner family, lockfile-pinned
  Playwright browsers, `en-US` browser locale, and UTC browser timezone.
- `visual/snapshots/github-windows/` is the authoritative visual baseline.
  Local platform images are historical references, not a release gate.
- Fix the browser clock and wait for `document.fonts.ready` before visual
  captures. Keep exact assertions and inspect actual/diff images before
  changing any baseline. Never regenerate baselines automatically after failure.
- Keep E2E and visual output/report directories separate. Upload both reports,
  screenshots, retained failure traces, and renderer/font metadata even when
  tests pass. A screenshot must be traceable to its candidate commit SHA.
- Preserve protected branches, immutable version tags, the `npm` environment,
  and Trusted Publishing. Follow publication authority in the active task;
  do not infer it from this file.
