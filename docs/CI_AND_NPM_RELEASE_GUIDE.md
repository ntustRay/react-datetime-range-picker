# CI and npm Release Guide

This guide describes how to add continuous integration and publish
`@ntustray/react-datetime-range-picker` safely. It is a plan and operating
manual, not a record of completed setup.

For local installation, library/demo builds, browser checks, tarball inspection,
and React 18/19 consumer verification, use the
[manual build guide](MANUAL_BUILD_GUIDE.md). Those steps do not publish to npm.

## Owner Quick Start（繁體中文）

你不需要自己寫 CI 或 release workflow。建議依照下面順序合作：

如果你想先在自己的 Windows 電腦完整重建一次，請直接照
[手動建置手冊](MANUAL_BUILD_GUIDE.md) 執行；手動建置不會發布套件。

1. 你說「開始做 CI」，Codex 建立並驗證 `ci.yml`、相關 scripts 與 packed
   consumer 測試，再 commit/push。
2. 你到 GitHub Actions 確認第一次 CI 全綠。
3. 你到 GitHub repository settings，把三個 CI jobs 設成 `main` 的 required
   checks；這是 repository owner 才能決定的保護規則。
4. 你說「開始 pre-release audit」，Codex 依 `TODO.md` 完成檢查、修正問題並
   提交報告。
5. 你確認第一版使用 `0.1.0`，並在 npm 帳號開啟 2FA、確認自己擁有
   `@ntustray` scope。
6. 第一次建立 npm package 時，由你執行或明確授權
   `npm publish --access public`；這一步會公開且不能重用相同版本。
7. Codex 建立完整 `release.yml`；你在 GitHub 建立受保護的 `npm`
   environment，並在 npm package settings 設定 Trusted Publishing。
8. 之後每次 release，Codex 可以準備 version、changelog、tag 與 GitHub
   Release；你只需要確認版本並核准 `npm` environment。

一般 repository 程式與 workflow 工作 Codex 都能做；npm 2FA、scope
ownership、GitHub 保護規則及最後的公開發布授權必須由你決定。

## Current Repository State

As of 2026-08-09:

- `package.json` is still version `0.0.0`.
- A registry lookup on 2026-08-09 returned `E404` for the package name. Recheck
  immediately before publishing because availability can change.
- `.node-version` pins Node `24.19.0`, and `package.json` pins npm `11.17.0`.
- There is no `.github/workflows/` directory yet.
- `npm run check` runs ESLint, Prettier checking, TypeScript, Vitest, and the
  package build, in that order.
- Playwright E2E and visual tests are separate scripts. Both configurations
  build the demo before starting its preview server.
- The committed visual baselines were generated on Windows.
- React 18 and React 19 consumer fixtures exist under `fixtures/`, but CI does
  not yet prove them against a packed tarball.
- npm publication and Trusted Publishing remain unchecked in
  [`TODO.md`](TODO.md).

## Who Does What

| Task                                                                    | Codex can do                                                  | Repository/npm owner must do                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Create and update workflow YAML                                         | Yes                                                           | Review and authorize push                        |
| Run local checks, inspect the tarball, and verify fixtures              | Yes                                                           | No account action required                       |
| Change the version and lockfile                                         | Yes, when requested                                           | Approve the intended version                     |
| Commit, push, tag, or create a release                                  | Yes, only with explicit authorization and working credentials | Approve the external publication point           |
| Inspect GitHub Actions failures                                         | Yes, when repository access is available                      | Resolve billing, policy, or account restrictions |
| Enable branch/tag rules or a protected GitHub environment               | No account settings should be changed implicitly              | Yes; these are repository-owner controls         |
| Own the `@ntustray` npm scope and package                               | No                                                            | Yes                                              |
| Log in to npm, enable 2FA, and perform an interactive bootstrap publish | No                                                            | Yes                                              |
| Configure npm Trusted Publishing and publishing access                  | No                                                            | Yes                                              |
| Approve a protected GitHub environment or staged npm package            | No                                                            | Yes                                              |
| Move an npm dist-tag, deprecate, or unpublish a release                 | Only with explicit incident authorization and credentials     | Owner decision; these affect users               |

Codex can prepare nearly all repository changes. The owner is still required
where npm/GitHub account ownership, 2FA, or an irreversible public release is
involved.

## Prerequisites

Before adding release automation:

1. Confirm `package.json.repository.url` still identifies
   `https://github.com/ntustRay/react-datetime-range-picker`. The current value
   uses npm's `git+https://...git` package-metadata form; verify npm accepts it
   as the same repository identity used by the Trusted Publisher
   ([npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)).
2. Confirm that the npm owner controls the `@ntustray` scope and has account
   2FA enabled. npm requires 2FA or an eligible bypass-2FA granular token for
   direct publishing, and recommends 2FA for account security
   ([npm 2FA requirements](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/)).
3. Check whether the package already exists:

   ```powershell
   npm.cmd view @ntustray/react-datetime-range-picker name version dist-tags
   ```

   A not-found response only means the package is not currently visible in the
   registry; it does not prove ownership of the scope.

4. Keep `.node-version`, `packageManager`, and the committed lockfile aligned.
   Trusted Publishing currently requires Node `>=22.14.0` and npm `>=11.5.1`,
   which this repository's pinned versions satisfy
   ([npm requirements](https://docs.npmjs.com/trusted-publishers/)).
5. Decide whether GitHub Releases will be immutable and whether a protected
   `npm` environment will require owner approval.

## Phase 1: Add Continuous Integration

Create `.github/workflows/ci.yml`. GitHub workflow files must live under
`.github/workflows/` ([workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)).

Use the version in `.node-version` rather than a floating Node version.
`actions/setup-node` supports `node-version-file`, and its npm cache stores npm's
global package data rather than `node_modules`
([setup-node README](https://github.com/actions/setup-node/blob/main/README.md)).

The recommended shape is three independently named required jobs:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm pack --dry-run

  browser:
    name: Browser and Visual
    runs-on: windows-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - name: Build current package before browser tests
        run: npm run build
      - name: Install the browser required by this repository
        run: npm exec -- playwright install chromium
      - run: npm run test:e2e
      - run: npm run test:visual
      - name: Upload Playwright diagnostics
        if: ${{ failure() }}
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: playwright-diagnostics-${{ github.run_id }}
          path: |
            playwright-report/
            test-results/
          if-no-files-found: ignore
          retention-days: 7
      - name: Generate GitHub Windows baseline candidates
        if: ${{ failure() }}
        run: npm run test:visual:update
      - name: Upload GitHub Windows baseline candidates
        if: ${{ failure() }}
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: visual-baseline-candidates-${{ github.run_id }}
          path: visual/snapshots/github-windows/
          if-no-files-found: error
          retention-days: 7

  consumers:
    name: Packed React Consumers
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Pack the exact artifact
        id: pack
        shell: bash
        run: |
          mkdir package-artifacts
          filename="$(npm pack --pack-destination package-artifacts --json | node -e "let input=''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => process.stdout.write(JSON.parse(input)[0].filename));")"
          echo "tarball=$GITHUB_WORKSPACE/package-artifacts/$filename" >> "$GITHUB_OUTPUT"
      - name: Verify React 18 consumer
        env:
          TARBALL: ${{ steps.pack.outputs.tarball }}
        run: |
          fixture="$(mktemp -d "$RUNNER_TEMP/react18.XXXXXX")"
          cp -R fixtures/react18/. "$fixture"
          cp fixtures/ssr-smoke.mjs "$fixture"
          cd "$fixture"
          node -e "const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.dependencies['@ntustray/react-datetime-range-picker']='file:' + process.env.TARBALL; fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');"
          rm package-lock.json
          npm install
          npm run typecheck
          node ssr-smoke.mjs
      - name: Verify React 19 consumer
        env:
          TARBALL: ${{ steps.pack.outputs.tarball }}
        run: |
          fixture="$(mktemp -d "$RUNNER_TEMP/react19.XXXXXX")"
          cp -R fixtures/react19/. "$fixture"
          cp fixtures/ssr-smoke.mjs "$fixture"
          cd "$fixture"
          node -e "const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.dependencies['@ntustray/react-datetime-range-picker']='file:' + process.env.TARBALL; fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');"
          rm package-lock.json
          npm install
          npm run typecheck
          node ssr-smoke.mjs
```

This example pins the action releases verified on 2026-08-09 to full commit
SHAs. Refresh the version comments and SHAs intentionally when upgrading an
action. GitHub states that a full-length commit SHA is the only immutable way
to reference an action
([GitHub secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use)).

### Why the order matters

The package must be built before E2E and visual tests. `tsdown` generates the
published ESM, declarations, source maps, and CSS, while Playwright's web server
only guarantees a fresh demo build. Keeping an explicit `npm run build` before
`npm run test:e2e` prevents a browser run from giving false confidence while
the package output is broken or stale.

Playwright requires browser binaries that match the installed Playwright
version; install them through the CLI
([Playwright browser installation](https://playwright.dev/docs/browsers)). Do
not use the archived third-party Playwright GitHub Action.

### Windows visual regression policy

Run the visual job on `windows-latest`. Local Windows 11 and GitHub's Windows
runner keep separate committed baseline directories because their font
rasterization differs. `playwright.visual.config.ts` selects the hosted set only
when `GITHUB_ACTIONS=true`, and both environments retain exact comparisons
without a broad pixel-difference allowance. Playwright warns that rendering
varies by host OS, settings, hardware, and headless mode, and recommends
comparing in the same environment used to generate the baselines
([Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)).

On failure, upload the original Playwright diagnostics before generating and
uploading a complete candidate hosted baseline. Inspect both artifacts before
replacing any committed image. If the project later moves visual CI to Linux,
create and review a separate Linux baseline set in one intentional change. Do
not accept a mass snapshot rewrite as an incidental CI fix.

### CI permissions and cancellation

`contents: read` is sufficient for checkout and tests. Once any workflow
permission is explicitly listed, unspecified permissions become `none`
([workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)).
The concurrency group cancels obsolete runs of the same workflow and ref
([GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)).

## Phase 2: Enable Branch Protection

The repository owner should do this only after `ci.yml` has run successfully at
least once, so the job checks are available for selection.

1. Open GitHub repository **Settings → Branches** or create a branch ruleset.
2. Target `main`.
3. Require a pull request before merging.
4. Require these uniquely named checks:
   - `Quality`
   - `Browser and Visual`
   - `Packed React Consumers`
5. Require conversation resolution.
6. Decide whether branches must be up to date before merging.
7. Block force pushes and deletion.
8. Consider preventing bypass, including by administrators.

GitHub documents both the available protections and the required permissions to
configure them ([about protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches),
[managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)).
Do not reuse a required job name in another workflow; GitHub warns that
ambiguous check names can block merging.

## Phase 3: Complete the Pre-Release Audit

Do not publish merely because CI is green. Complete the open audit in
[`TODO.md`](TODO.md), including:

- inspect production code for `any`, avoidable assertions, false optionality,
  and unclear iteration;
- confirm there are no runtime dependencies and React/React DOM remain peers;
- verify SSR-safe imports and the intended public export surface;
- close critical validation, keyboard, required-state, timezone, and DST E2E
  gaps or record explicit release limitations;
- manually test accessibility at zoom, contrast, forced-colors, reduced motion,
  and with one screen reader;
- build, run `npm pack --dry-run`, and inspect the exact file list;
- install the actual tarball into clean React 18 and React 19 consumers and
  verify JavaScript, declarations, and `styles.css`;
- compile README examples against the tarball;
- inspect bundle size and source maps;
- run `npm audit` and assess findings rather than applying an uncontrolled
  `npm audit fix`;
- verify the license, repository metadata, package name, and known limitations;
- start from a clean checkout with `npm ci`, then run all required checks.

`npm pack --dry-run` reports what would enter the tarball
([npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/)). The current
`package.json.files` allowlist should result in only `dist`, `README.md`,
`LICENSE`, and npm-required metadata.

## Phase 4: Choose Version `0.1.0`

The first public version is `0.1.0`. This deliberately communicates that the
library is usable while its public API may still evolve before `1.0.0`.

`0.1.0` is appropriate only if the project intentionally describes the public
API as still evolving. SemVer identifies `0.y.z` as initial development and
`1.0.0` as the point where the public API is defined
([Semantic Versioning 2.0.0](https://semver.org/)). npm's introductory guidance
often recommends `1.0.0` for a first product release, so choosing `0.1.0` should
be a deliberate stability signal, not an accident
([npm semantic versioning](https://docs.npmjs.com/about-semantic-versioning/)).

After the audit is accepted:

```powershell
npm.cmd version 0.1.0 --no-git-tag-version
npm.cmd run check
npm.cmd run build
npm.cmd pack --dry-run
git diff -- package.json package-lock.json
```

Commit the version change before creating `v0.1.0`. Never publish from a dirty
worktree or reuse a version already published to npm.

## Phase 5: Bootstrap the npm Package Safely

`@ntustray/react-datetime-range-picker` is scoped. A scoped package must be
published with public access explicitly
([npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)).

There is an important bootstrap boundary: npm's documented Trusted Publisher
configuration starts from an existing package's settings, and `npm trust`
requires the package to exist. Do not assume OIDC can create a package that does
not exist.

If the package does not exist, the owner must perform the first direct publish
after reviewing the tarball and authenticating with 2FA:

```powershell
npm.cmd login
npm.cmd whoami
npm.cmd publish --access public
```

Before that final command, confirm all of the following from a clean `main`:

```powershell
git status -sb
git tag --list v0.1.0
npm.cmd view @ntustray/react-datetime-range-picker@0.1.0 version
npm.cmd run check
npm.cmd run test:e2e
npm.cmd run test:visual
npm.cmd run test:consumers
npm.cmd pack --dry-run --json
```

The expected pre-publication registry result is `E404`. Stop if the version or
tag already exists, the worktree is dirty, or any verification fails. Publish
`0.1.0` before creating its tag and GitHub Release so an authentication or
registry failure cannot leave an official release pointing to an absent npm
artifact. Immediately after publishing, run the post-publish checks below,
then create the annotated tag and GitHub Release from the exact published
commit.

This is an externally visible, effectively irreversible action. Codex can
prepare and verify it, but the owner should execute or explicitly authorize it.
The simplest policy is to make `0.1.0` the manual bootstrap release and use OIDC
from the next version onward. If provenance on the very first release is a hard
requirement, stop and confirm an npm-supported bootstrap route instead of
inventing one.

After the first publish, verify the package page, public visibility, owner, and
contents before configuring automation.

## Phase 6: Configure Trusted Publishing

The npm owner performs these steps on npmjs.com:

1. Open the package **Settings → Trusted publishing**.
2. Select GitHub Actions.
3. Enter the exact GitHub organization/user and repository.
4. Enter only the exact workflow filename, for example `release.yml`, including
   the extension.
5. Optionally enter a protected GitHub environment name such as `npm`.
6. Allow `npm publish` (or use stage-only publishing if owner approval through
   npm staged publishing is preferred).
7. Save and double-check every case-sensitive value. npm does not validate the
   relationship when it is saved; mistakes normally appear only during publish.

Each package can have only one Trusted Publisher. GitHub Actions publishing
requires a GitHub-hosted runner, `contents: read`, and `id-token: write`; no
long-lived `NPM_TOKEN` is required
([npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)). OIDC
applies to `npm publish`/`npm stage publish`, not `npm whoami`, installs,
dist-tags, or other owner commands.

After one OIDC release succeeds:

1. Set package **Publishing access** to **Require two-factor authentication and
   disallow tokens**.
2. Revoke obsolete automation tokens.
3. Keep interactive owner recovery access protected by 2FA.

Do not disable tokens before the Trusted Publisher has been proven, or a
configuration typo can leave the release path unavailable.

## Phase 7: Add the Release Workflow

Create `.github/workflows/release.yml`. A `release: published` trigger gives the
owner one final opportunity to review the tag and release notes before npm
publication. GitHub documents release creation and management separately from
the workflow itself
([GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)).

The workflow should:

- use a GitHub-hosted runner;
- set workflow-level `contents: read` only;
- serialize releases rather than canceling an in-progress publish;
- rerun `npm ci`, `npm run check`, E2E, visual, tarball, and React 18/19 fixture
  gates before publish;
- verify `vX.Y.Z` exactly matches `package.json.version`;
- grant `id-token: write` only to the final publish job;
- disable package-manager caching in the privileged publish job;
- run `npm publish --access public` without `NODE_AUTH_TOKEN`.

Final publish-job excerpt (not a standalone workflow):

```yaml
name: Release

on:
  release:
    types: [published]

permissions:
  contents: read

concurrency:
  group: npm-release

jobs:
  # Add verification jobs equivalent to CI: quality, browser, and consumers.

  publish:
    name: Publish npm
    needs: [quality, browser, consumers]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: npm ci
      - run: npm run check
      - name: Verify tag matches package version
        shell: bash
        run: |
          package_version="$(node -p "require('./package.json').version")"
          test "${GITHUB_REF_NAME}" = "v${package_version}"
      - run: npm publish --access public
```

Do not copy the comment as an incomplete production workflow: implement the
three verification jobs before enabling publication. For maximum workflow
supply-chain protection, replace major action tags with verified full SHAs.

Trusted Publishing automatically creates provenance for a public package built
from a public repository; `--provenance` is not required
([automatic provenance](https://docs.npmjs.com/trusted-publishers/#automatic-provenance-generation)).
Private repositories do not receive this automatic provenance even when the
package is public.

## First Automated Release

For the first OIDC-enabled release after bootstrap:

1. Pull and confirm `main` is clean and CI is green.
2. Choose the next unused version and update `package.json` plus lockfile.
3. Complete the audit and packed-consumer verification.
4. Commit and merge through protected `main`.
5. Create an annotated `vX.Y.Z` tag pointing at that exact commit.
6. Create and publish a GitHub Release for that tag.
7. If configured, approve the protected `npm` environment.
8. Watch every release verification job; do not retry publication blindly.
9. Verify npm metadata, tarball, exports, CSS, dist-tag, and provenance.

Example post-publish checks:

```powershell
npm.cmd view @ntustray/react-datetime-range-picker version dist-tags repository peerDependencies dependencies
npm.cmd pack @ntustray/react-datetime-range-picker@X.Y.Z --dry-run
```

Then install the registry version—not a local path—into a new temporary React
consumer and confirm JavaScript, types, and CSS imports.

## Later Releases

For every later version:

1. Classify the change using the documented compatibility policy.
2. Update changelog/release notes and the package version.
3. Run CI, audit affected behavior, and inspect the packed artifact.
4. Merge only after required checks pass.
5. Publish an immutable `vX.Y.Z` release.
6. Verify npm and a clean consumer.

Stable releases should use npm's default `latest` tag. Prereleases should use a
non-default tag such as `next` or `beta`; `npm publish` otherwise updates
`latest` automatically
([npm dist-tags](https://docs.npmjs.com/cli/v11/commands/npm-dist-tag/)).

## Recovery and Rollback

npm releases are not Git commits: a published version cannot be overwritten or
reused. The normal recovery sequence is:

1. If the bad release owns `latest`, move `latest` back to the last known good
   version:

   ```powershell
   npm.cmd dist-tag add @ntustray/react-datetime-range-picker@LAST_GOOD latest
   ```

2. Deprecate the bad version with an actionable message:

   ```powershell
   npm.cmd deprecate @ntustray/react-datetime-range-picker@BAD_VERSION "Known issue; use LAST_GOOD or FIXED_VERSION."
   ```

3. Fix the problem and publish a new patch version.

Dist-tag and deprecation commands require owner authentication; Trusted
Publishing OIDC does not authorize them. npm recommends deprecation over
unpublishing because existing installs keep working with a warning
([deprecating packages](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions/)).

Use `npm unpublish` only for a serious accidental disclosure and only when npm's
policy allows it. Even an unpublished version can never be reused, and deleting
an entire package can impose a republish delay
([npm unpublish policy](https://docs.npmjs.com/policies/unpublish/)).

## Troubleshooting

### `npm ci` fails

- Confirm `package.json` and `package-lock.json` were committed together.
- Use the pinned Node/npm versions.
- Reproduce from a clean checkout. `npm ci` intentionally fails rather than
  rewriting an inconsistent lockfile
  ([npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)).

### Playwright cannot find Chromium

Run `npx playwright install chromium` after `npm ci`. Reinstall browser binaries
after upgrading `@playwright/test`, because browser revisions are version-coupled.

### Visual snapshots fail only in CI

Confirm the CI OS, Playwright version, browser channel, color scheme, fonts,
viewport, reduced motion, and clock match the baseline environment. Inspect the
diff artifacts; do not update snapshots automatically in CI.

### Required check is missing or permanently pending

Run the workflow once, verify the exact unique job name, and make sure workflow
path filters did not skip a required workflow. GitHub notes that skipped
required workflows can remain pending
([workflow filters](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)).

### npm publish returns `ENEEDAUTH`

Check all of the following:

- the workflow filename exactly matches npm's Trusted Publisher setting;
- organization, repository, environment, and case match;
- the workflow exists under `.github/workflows/`;
- the publish job runs on a GitHub-hosted runner;
- the publish job has `id-token: write`;
- Node/npm meet npm's Trusted Publishing minimum versions;
- `repository.url` points to this exact GitHub repository;
- no reusable/manual workflow changed which calling workflow npm validates.

`npm whoami` is not an OIDC diagnostic because OIDC authentication occurs only
during supported publish commands.

### Version already exists

Never retry with the same version. Inspect the registry, determine whether the
publish actually succeeded, then bump to a new version if content must change.

## Concise Checklist

### One-time setup

- [ ] Add `ci.yml` with `Quality`, `Browser and Visual`, and
      `Packed React Consumers`.
- [ ] Run CI green once and require those checks on `main`.
- [ ] Finish the pre-release audit and record limitations.
- [ ] Confirm npm scope ownership, account 2FA, and package existence.
- [ ] Decide and set version `0.1.0` deliberately.
- [ ] If the package is absent, owner performs the reviewed public bootstrap
      publish.
- [ ] Configure npm Trusted Publishing with the exact `release.yml` filename.
- [ ] Add complete release verification and a final OIDC publish job.
- [ ] After OIDC succeeds, disallow token publishing and revoke automation
      tokens.

### Every release

- [ ] Clean `main`; version and tag agree; version is unused.
- [ ] CI, E2E, Windows visual regression, tarball, and React 18/19 fixtures pass.
- [ ] Tarball contents, README examples, exports, CSS, license, and metadata are
      reviewed.
- [ ] GitHub Release is published from the exact audited commit.
- [ ] npm version, `latest`/prerelease tag, provenance, and clean install are
      verified.
- [ ] If broken: move `latest`, deprecate, and publish a new patch; do not reuse
      or casually unpublish a version.
