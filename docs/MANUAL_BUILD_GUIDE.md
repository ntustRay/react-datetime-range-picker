# Build and verification guide

Run commands from the repository root in a shell with Node from `.node-version`
and npm from `package.json`'s `packageManager` (currently Node `24.19.0`, npm
`11.17.0`). Use your existing version manager; no personal directory or shell
profile is required. In PowerShell, use `npm.cmd` if script execution policy
blocks `npm`.

```sh
node --version
npm --version
npm ci
npm run check
npm run test:consumers
npm pack --dry-run
```

`npm ci` must succeed with the committed lockfile. Do not rewrite the lockfile
or downgrade assertions to accommodate a machine. `check` runs ESLint,
Prettier, TypeScript, Vitest, and a fresh tsdown build. `dist/` contains the ESM
modules, `.d.mts` declarations, source maps, and `styles.css` export.

`test:consumers` packs the current build into a temporary directory and checks
React 18/19 declarations, README examples, JS/SSR, CSS resolution, single React
copies, Vite output, and utility tree shaking. It does not publish and does not
prove an already-published registry artifact works.

## Browser checks

```sh
npm exec -- playwright install --with-deps chromium firefox webkit
npm run build
npm run test:e2e
npm run test:visual
```

On platforms where system dependencies are already provided, the browser install
can omit `--with-deps`. E2E covers Chromium, Firefox, and WebKit. The authoritative
Visual gate runs on GitHub Actions with its reviewed renderer and baseline;
local operating systems may produce different pixels. No local Windows setup
is required to deliver the package. See [visual testing](VISUAL_TESTING.md) for
artifact inspection, baseline review, and exact comparison policy.

The two suites preserve separate HTML reports under `playwright-report/` and
screenshots/traces under `test-results/`. A failing setup is not a passing
browser test. Build the current source before retrying browser verification.

## Preview

```sh
npm run demo
```

Use the URL printed by Vite. To inspect the production demo:

```sh
npm run build
npm run demo:build
npm exec -- vite preview demo --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`. Stop the server with Ctrl+C. CI disables reuse of
an existing server so it cannot test stale output.

## Review and release

```sh
git status -sb
git diff --check
npm pack --dry-run --json
```

Inspect only intended source, documentation, and reviewed snapshot changes.
Do not commit tarballs, reports, dependencies, credentials, or environment files.
Publication uses the protected immutable-tag workflow in the
[release guide](CI_AND_NPM_RELEASE_GUIDE.md), followed by an exact registry
version install into clean consumers. These manual commands do not publish.
