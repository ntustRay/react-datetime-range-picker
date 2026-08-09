# Pre-release audit

Audit date: 2026-08-09

This audit covers the `0.0.0` release candidate before npm publication. The
library gates pass, but publication remains deferred until the version, npm
scope access, trusted publishing, provenance, and release tag work in Section
23 of [TODO.md](TODO.md) is complete.

## Source and API review

- Production code contains no `any` or TypeScript assertions.
- Optional public props represent omitted configuration with documented
  defaults. Domain values that exist but may be empty use explicit `null`.
- Production iteration uses purpose-specific array methods or `for...of`; it
  does not use `forEach`.
- The public runtime surface contains `DateTimeRangePicker`,
  `normalizeTimestamp`, and `validateDateTimeRange`. The remaining exports are
  reviewed public domain types; no internal rendering module is exported.
- `package.json` has no runtime `dependencies`. React 18 or 19 and React DOM 18
  or 19 remain peer dependencies and are excluded from the bundle.

## Behavior evidence

- 94 unit and component tests cover normalization, every validation error,
  deterministic DST behavior, calendar and keyboard behavior, controlled draft
  behavior, public types, and SSR rendering.
- 23 Playwright E2E tests cover complete pointer and keyboard workflows,
  invalid text, non-increasing ranges, minimum and maximum timestamps, maximum
  duration, stepped time fields, required mode, DST guidance, stable test IDs,
  and focus restoration.
- 20 exact visual comparisons cover desktop and mobile layouts, themes,
  precision modes, period views, constraints, invalid ranges, and DST states.
  Local Windows and GitHub Windows baselines remain separate because their font
  rasterization differs.
- React 18 and React 19 packed consumers compile the README example and render
  the installed tarball with `react-dom/server` in a Node environment.

## Package evidence

`npm pack` contains only these eight files:

- `LICENSE`
- `README.md`
- `dist/index.d.mts`
- `dist/index.d.mts.map`
- `dist/index.mjs`
- `dist/index.mjs.map`
- `dist/style.css`
- `package.json`

The audited production build is 71.94 kB JavaScript (15.33 kB gzip) and 15.48
kB CSS (3.33 kB gzip). The tarball is 55,360 bytes compressed and 252,710
bytes unpacked. React and React DOM are not bundled.

The npm registry returned `E404` for
`@ntustray/react-datetime-range-picker` during this audit, so no public package
currently occupies that exact name. This is not a reservation: recheck the name
and confirm publish access to the `@ntustray` scope immediately before release.

`npm audit` reported zero known vulnerabilities. The MIT license and 2026
ntustRay copyright notice are present in both the repository and packed
artifact.

## Known limitations

- The package is ESM-only and targets the Node versions in `package.json`.
- The controlled component does not provide native form serialization.
- The calendar displays one month at a time.
- Floating and inline presentations are supported; modal and headless APIs are
  not.
- Presets and timezone option lists are consumer supplied.
- Browser support targets modern Chrome, Edge, Firefox, and Safari; Internet
  Explorer is not supported.

These limitations match the public contract and are not release blockers.
