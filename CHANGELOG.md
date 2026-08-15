# Changelog

All notable changes to this package are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Add user-visible changes under `Unreleased` as they merge. At release time,
move those entries into a dated version section. GitHub release notes use that
version section as their source, supplemented only with verification results
and known limitations from the pre-release audit.

## Unreleased

## 0.2.0 - 2026-08-15

### Added

- Ten built-in interface locales with automatic language matching and English
  fallback: English, Traditional Chinese, Simplified Chinese, Japanese, Korean,
  Spanish, French, German, Brazilian Portuguese, and Russian.
- Localization documentation for fixed locales, runtime language switching,
  regional fallback behavior, and per-label overrides.

### Changed

- `locale` now selects built-in visible and accessible wording in addition to
  controlling `Intl` date formatting; `localeText` remains a partial override.
- Refined hour-cycle, AM/PM, UTC-offset, and Russian range terminology after a
  primary-source locale comparison.

### Fixed

- Prevented calendar and footer controls from overflowing narrow picker
  containers with long translated labels.

## 0.1.1 - 2026-08-13

### Added

- Timestamp-first npm documentation, search metadata, live-demo positioning,
  and a packaged desktop preview.
- Protected tag release automation for npm Trusted Publishing, provenance,
  release-only GitHub Pages deployment, and GitHub Release creation.
- Node 22 compatibility coverage alongside the pinned Node 24 toolchain.

### Changed

- The interactive demo now starts with a fixed epoch-millisecond range and
  exposes the exact draft, committed, duration, and half-open range values.
- Consumer Node metadata now accepts Node `>=22.18.0` without excluding odd
  releases for development-tooling reasons.
- The npm tarball includes the public API contract while maintainer-only
  documentation uses durable GitHub links.

## 0.1.0 - 2026-08-12

### Added

- Accessible controlled React date-time range picker with distinct draft and
  committed values.
- Epoch-millisecond range editing with UTC defaults, IANA display time zones,
  precision normalization, and explicit DST gap and overlap handling.
- Pointer, text, and complete keyboard workflows with localized labels,
  configurable validation messages, themes, presets, and stable test IDs.
- ESM package, TypeScript declarations, exported CSS, source maps, SSR support,
  and zero runtime dependencies.
- Verified React 18 and React 19 consumers, Chromium, Firefox, WebKit, and
  desktop and mobile visual baselines.

[Unreleased]: https://github.com/ntustRay/react-datetime-range-picker/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ntustRay/react-datetime-range-picker/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/ntustRay/react-datetime-range-picker/compare/v0.1.0...v0.1.1
