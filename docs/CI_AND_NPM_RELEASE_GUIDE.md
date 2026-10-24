# CI and npm release guide

The workflow files are the executable source of truth:
[CI](../.github/workflows/ci.yml) and
[Release](../.github/workflows/release.yml). This guide records the operating
policy, not a second copy of their YAML. Release history belongs in
[CHANGELOG.md](../CHANGELOG.md) and GitHub Releases.

## Verification gates

- **Node 22 Compatibility** runs `npm run check` on Node `22.18.0`.
- **Quality** runs the primary Node version's `check` and `npm pack --dry-run`.
- **Browser and Visual** builds current source, installs the lockfile-matched
  Chromium/Firefox/WebKit, runs E2E and 21 exact Visual comparisons, and uploads
  reports/screenshots even on success.
- **Packed React Consumers** verifies the built tarball in clean React 18/19
  consumers, including types, JavaScript/SSR, CSS, and Vite/tree shaking.

Node is pinned in `.node-version` and npm `11.17.0` in `packageManager`.
Workflows install that exact npm version before `npm ci`. Release quality runs
both supported Node versions, and release browser/consumer gates match CI.
Full action SHAs and unique required-check names remain unchanged.

Browser jobs use `windows-2025`, `en-US` locale, UTC timezone, and bundled
Playwright browsers. `visual/snapshots/github-windows/` is the single
selected baseline; the fixed clock, font readiness, reports, environment/font
metadata, and review policy are documented in [VISUAL_TESTING.md](VISUAL_TESTING.md).
No contributor machine is a publishing prerequisite. Do not switch runner
families or replace baselines without reviewing actual/diff images.

Every browser artifact is named with the exact commit SHA and attempt. Separate
E2E/Visual reports prevent overwrite, and failures retain traces/diagnostics.
Do not use an older green run as evidence for a newer candidate. A visual
failure never automatically updates baselines or bypasses a release gate.

## Authority and protection

As verified before the 2026-10-19 iteration, npm `latest` is `0.2.0`, and that
version's CI and tag release completed successfully. Determine current state
from the registry and Actions on each run rather than treating this sentence
as a permanent release status.

The owner authorized this project's scheduled compatible patch iterations to
commit, normally push, tag after required checks, and publish to npm after
verification without per-iteration approval. This replaces only the attached
per-commit approval rule for that task. It does not authorize changing branch
protection, environment reviewers, npm ownership, credentials, or dist-tags for
rollback. Other work still needs authority from its active request.

`main` requires `Quality`, `Browser and Visual`, and `Packed React Consumers`.
Respect protected-branch and PR requirements; never force-push or bypass gates.
The `npm` environment and Trusted Publisher identity remain unchanged. If a
manual environment approval blocks publication, report that state explicitly.

## Publish a compatible patch

1. Inspect current main/PRs/TODO and choose a bounded, reproducible improvement.
2. Complete RED → minimal fix → GREEN through a public seam and add related
   E2E coverage. Inspect hosted visual evidence before changing any PNG.
3. Choose the next unused patch version. Update `package.json`, lockfile,
   changelog date/notes, affected documentation, and next TODO criteria.
4. Run `npm ci`, `npm run check`, `npm run test:e2e`, `npm run test:visual`,
   `npm run test:consumers`, and `npm pack --dry-run`; record where each ran.
5. Review the complete diff, commit only this iteration, and normally push
   through the permitted branch/PR flow. Verify all required checks on the exact
   candidate. After merging, verify the resulting main SHA as well.
6. Create a new annotated `vX.Y.Z` tag at that verified main SHA and normally
   push it. Never reuse or move an existing tag.
7. Follow `release.yml` through quality, browser/visual, and consumers. It checks
   that the tag matches `package.json.version` and belongs to main.
8. The protected `npm` job publishes using OIDC Trusted Publishing and
   `npm publish --access public --provenance`. Do not add an `NPM_TOKEN` or
   substitute direct interactive publication.
9. Verify the exact registry version, tarball, provenance, and `latest`, then
   install that registry version into clean React 18/19 consumers and check
   JS/SSR, declarations, and CSS exports. A local `npm pack` is not this check.
   Run `npm run test:consumers -- X.Y.Z` to reuse the clean React 18/19 fixtures
   against that exact registry version. The publish job now runs this check
   after `npm publish`; a consumer failure stops downstream deployment.
10. Track the subsequent Pages deployment and GitHub Release separately.
    Release notes come from the matching dated changelog section. A failed demo
    or GitHub Release does not imply that npm publication failed.

```sh
npm view @ntustray/react-datetime-range-picker version dist-tags --json
npm view @ntustray/react-datetime-range-picker@X.Y.Z dist --json
npm pack @ntustray/react-datetime-range-picker@X.Y.Z --dry-run
```

Run the clean-consumer checks against `@ntustray/react-datetime-range-picker@X.Y.Z`,
not a `file:` dependency. Preserve run/artifact/commit/tag/registry links in the
iteration report and reconcile `docs/TODO.md` only with actual evidence.

## Failures and recovery

- For a test failure, inspect its logs/report/trace and reproduce the failure;
  fix the cause rather than adding skips or speculative tolerance.
- For `npm ci`, check runtime versions and manifest/lock consistency.
- For renderer drift, compare the saved runner image/font metadata and
  expected/actual/diff PNGs before reviewing a baseline change.
- For publish authentication, check the exact repository, `release.yml`, `npm`
  environment, `id-token: write`, and existing Trusted Publisher. Keep protection
  intact and report permission/manual approval blockers.
- For a transient publish failure, first inspect registry metadata and logs. If
  the exact version already exists, verify it instead of publishing again. Do
  not bump merely to retry a network failure.
- Published versions and tags are immutable. Prefer a new corrective patch;
  changing `latest`, deprecating, or unpublishing requires separate incident
  authorization and owner credentials.

Owner-only configuration remains npm account/scope/2FA, Trusted Publisher
settings, branch/environment protection, and GitHub Pages source. No credentials
or account settings are added by a routine iteration.

References: [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/),
[Playwright snapshots](https://playwright.dev/docs/test-snapshots),
[Playwright browsers](https://playwright.dev/docs/browsers), and
[SemVer](https://semver.org/).

## Existing GitHub Releases

Creating the tag through the GitHub Release UI can leave a published release
before the tag workflow finishes. The final job accepts an existing published
release for that tag rather than attempting a duplicate create (HTTP 422).
An existing draft fails the gate; lookup/create errors still fail the job.
This changes no npm environment or verification protections.
