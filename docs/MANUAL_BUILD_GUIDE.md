# Manual Build Guide（手動建置手冊）

這份手冊說明如何在 Windows PowerShell 或 Git Bash 從乾淨 checkout 手動
建置、驗證及預覽 `@ntustray/react-datetime-range-picker`。所有命令都從
repository root 執行。

手動建置只會產生本機檔案；它不會 commit、push、建立 Git tag 或發布到
npm。公開發布請另外依照
[CI and npm release guide](CI_AND_NPM_RELEASE_GUIDE.md) 操作。

## 1. 進入專案並確認工具版本

### PowerShell

```powershell
Set-Location C:\Users\MingRay\react-datetime-range-picker
node --version
npm.cmd --version
```

目前預期版本為：

- Node `v24.19.0`，來源是 `.node-version`。
- npm `11.17.0`，來源是 `package.json` 的 `packageManager`。

如果你已經使用 fnm，可以先切換 Node：

```powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
fnm use (Get-Content .node-version)
node --version
npm.cmd --version
```

第一行會在目前 PowerShell session 載入 fnm 環境；如果 shell profile 已經
設定 fnm，重跑也不會改動 repository。最後兩行仍未顯示預期版本時，先停止
並調整本機 Node/npm。不要修改 `.node-version`、`packageManager` 或 lockfile
來配合個人電腦。

### Git Bash

目前這台電腦的 `.bash_profile` 會載入 `.bashrc`，而 `.bashrc` 已初始化
`fnm 1.38.1` 並啟用 `--use-on-cd`。重新開啟 Git Bash、進入 repository
後，fnm 會依 `.node-version` 自動選擇 Node：

```bash
cd /c/Users/MingRay/react-datetime-range-picker
node --version
npm --version
```

預期分別顯示 `v24.19.0` 和 `11.17.0`。在 Git Bash 使用 fnm 切換後，後續
命令使用 `npm`，不要寫成 PowerShell 專用的 `npm.cmd`。

如果要在其他電腦重建相同設定，讓 `.bash_profile` 載入 `.bashrc`，並在
`.bashrc` 加入：

```bash
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --use-on-cd --shell bash)"
fi
```

這是個人 shell 設定，不是 repository 設定。若 Git Bash 在設定前已經開啟，
請重新開啟，或執行 `source ~/.bash_profile` 載入新設定。

### WSL Ubuntu

目前 WSL Ubuntu 沒有找到 Linux 版 `fnm`、`nvm`、Volta、asdf、mise 或
Node。WSL 只看得到 Windows npm 路徑，這不算可用的 WSL Node 開發環境。
要在 WSL 建置前，應先另外安裝 Linux 版 Node version manager，再依
`.node-version` 安裝 Node `24.19.0`；不要混用 Windows npm 和 WSL filesystem。

## 2. 安裝完全相同的依賴

```powershell
npm.cmd ci
```

`npm ci` 依照已提交的 `package-lock.json` 重建 `node_modules`。如果它回報
lockfile 與 `package.json` 不一致，先停止並檢查變更；不要用
`npm install` 默默重寫 lockfile。

## 3. 最短建置流程

只需要產生可發布的 library 檔案時：

```powershell
npm.cmd run build
Get-ChildItem dist
```

成功後 `dist/` 應包含：

```text
index.mjs
index.mjs.map
index.d.mts
index.d.mts.map
style.css
```

`npm run build` 使用 tsdown 並在每次建置前清理 `dist/`，所以不需要先手動
刪除舊產物。

## 4. 發布前等級的完整驗證

建議在準備 release 或大範圍修改後依序執行：

```powershell
npm.cmd run check
npm.cmd run demo:build
npm.cmd run test:e2e
npm.cmd run test:visual
npm.cmd pack --dry-run
```

一次執行一行，確認 exit code 是 `0` 再進行下一行；任何一步失敗都不要繼續
發布。

各命令負責的範圍：

| Command                   | 驗證內容                                              |
| ------------------------- | ----------------------------------------------------- |
| `npm.cmd run check`       | ESLint、Prettier、TypeScript、Vitest 和 library build |
| `npm.cmd run demo:build`  | Vite demo 可以產生 production build                   |
| `npm.cmd run test:e2e`    | Chromium 中的真實操作流程                             |
| `npm.cmd run test:visual` | UI 與已提交的 Windows screenshot baselines 是否一致   |
| `npm.cmd pack --dry-run`  | npm tarball 預計包含的檔案，不實際發布                |

第一次執行 Playwright 前，如果本機還沒有 Chromium：

```powershell
npm.cmd exec -- playwright install chromium
```

如果 visual test 失敗，先開啟 `test-results/` 的 diff 圖並判斷是否為預期的 UI
變更。只有確認畫面變更正確時才執行：

```powershell
npm.cmd run test:visual:update
```

更新後仍要親自檢查 `visual/snapshots/` 內的 PNG，並把 intentional baseline
changes 和相關 UI 修改放在同一個 commit。

## 5. 在瀏覽器手動檢查 demo

開發模式會自動反映程式變更：

```powershell
npm.cmd run demo
```

開啟終端顯示的 local URL；目前 Vite 通常使用
`http://127.0.0.1:5173/`。檢查完成後在該終端按 `Ctrl+C` 停止 server。

如果要檢查真正的 production demo build：

```powershell
npm.cmd run demo:build
npm.cmd exec -- vite preview demo --host 127.0.0.1 --port 4173
```

然後開啟 `http://127.0.0.1:4173/`。建置輸出位於 `demo/dist/`。

## 6. 產生並檢查真正的 npm tarball

`--dry-run` 適合快速檢查；發布前應再產生一次真正的 `.tgz`：

```powershell
$buildScratch = Join-Path $env:TEMP ("dtrp-build-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $buildScratch | Out-Null
npm.cmd pack --pack-destination $buildScratch
if ($LASTEXITCODE -ne 0) {
  throw "npm pack failed"
}

$packageArchive = Get-ChildItem -LiteralPath $buildScratch -Filter *.tgz |
  Select-Object -First 1
if ($null -eq $packageArchive) {
  throw "npm pack did not create a tarball"
}

$packageArchive | Select-Object FullName, Length
tar.exe -tf $packageArchive.FullName
```

確認 tarball 只包含發布需要的 package metadata、README、LICENSE 和
`dist/` 產物，不應包含 `src/`、tests、demo、screenshots、credentials 或
本機設定。

## 7. 用 tarball 驗證 React 18 和 React 19 consumers

這個流程複製現有 fixtures 到系統暫存目錄，不會改動 repository 裡的 fixture
或 lockfile。先完成上一節，讓 `$packageArchive` 指向剛產生的 `.tgz`：

```powershell
$archivePath = $packageArchive.FullName.Replace("\", "/")
$fixtureScratch = Join-Path $env:TEMP ("dtrp-fixtures-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $fixtureScratch | Out-Null

foreach ($reactVersion in @("react18", "react19")) {
  $sourceFixture = Join-Path (Get-Location) "fixtures/$reactVersion"
  $targetFixture = Join-Path $fixtureScratch $reactVersion
  New-Item -ItemType Directory -Path $targetFixture | Out-Null
  Copy-Item -LiteralPath (Join-Path $sourceFixture "package.json") `
    -Destination $targetFixture
  Copy-Item -LiteralPath (Join-Path $sourceFixture "tsconfig.json") `
    -Destination $targetFixture
  Copy-Item -LiteralPath (Join-Path $sourceFixture "src") `
    -Destination $targetFixture -Recurse

  $fixturePackagePath = Join-Path $targetFixture "package.json"
  $fixturePackage = Get-Content -Raw $fixturePackagePath | ConvertFrom-Json
  $fixturePackage.dependencies.'@ntustray/react-datetime-range-picker' =
    "file:$archivePath"
  $fixturePackage | ConvertTo-Json -Depth 10 |
    Set-Content -Encoding utf8 $fixturePackagePath

  npm.cmd install --prefix $targetFixture
  if ($LASTEXITCODE -ne 0) {
    throw "$reactVersion install failed"
  }

  npm.cmd run typecheck --prefix $targetFixture
  if ($LASTEXITCODE -ne 0) {
    throw "$reactVersion typecheck failed"
  }
}
```

兩個 `typecheck` 都成功，代表實際 tarball 的 ESM entry、declaration files、
React peer dependency 範圍與 CSS export 可以被兩個支援版本消費。暫存資料夾
保留在 `$fixtureScratch`，方便失敗時檢查；確認完成後可自行刪除。

## 8. 建置失敗時怎麼判斷

依第一個失敗的命令處理，不要跳過錯誤繼續發布：

- `npm ci`：檢查 Node/npm 版本，以及 `package.json` 和 lockfile 是否一致。
- `lint` 或 `format:check`：修正對應檔案，不要降低規則或加入忽略項目掩蓋
  問題。
- `typecheck`：修正真正的 domain type 問題，不要用 `any` 或不必要的 `as`。
- `test`：先重跑單一相關 Vitest test，再跑完整 `npm run check`。
- `test:e2e`：先確認 Chromium 已安裝，且 port `4173` 沒有被其他 server
  佔用。
- `test:visual`：先看 diff；不要只因為測試失敗就更新 baseline。
- `npm pack`：先確認 `npm run build` 成功，再檢查 `package.json.files` 和
  `exports`。

## 9. 完成標準

一次可交付的手動建置至少要符合：

- `npm.cmd run check` 成功。
- `npm.cmd run demo:build` 成功。
- E2E 和 Windows visual regression 成功。
- `npm.cmd pack --dry-run` 的檔案清單正確。
- release 前，實際 tarball 在 React 18 與 React 19 fixtures 都通過
  typecheck。
- `git status -sb` 只顯示你預期的 source、docs 或 intentional snapshot
  變更，不包含暫存 tarball 或 credentials。

最後檢查：

```powershell
git status -sb
git diff --check
```

## 10. Git Bash 建置命令

完成第 1 節的 fnm 初始化與版本確認後，最短 library build 是：

```bash
npm ci
npm run build
ls -la dist
```

發布前等級的完整檢查是：

```bash
npm run check
npm run demo:build
npm run test:e2e
npm run test:visual
npm pack --dry-run
```

仍然要一次執行一行，確認成功後才繼續。第一次使用 Playwright 時：

```bash
npm exec -- playwright install chromium
```

啟動開發版 demo：

```bash
npm run demo
```

檢查 production demo build：

```bash
npm run demo:build
npm exec -- vite preview demo --host 127.0.0.1 --port 4173
```

產生真正的 tarball 並檢查內容：

```bash
build_scratch="$(mktemp -d)"
npm pack --pack-destination "$build_scratch"
package_archive="$(find "$build_scratch" -maxdepth 1 -name '*.tgz' -print -quit)"
test -n "$package_archive"
ls -lh "$package_archive"
tar -tf "$package_archive"
```

Git Bash 的完整 React 18/19 packed-consumer 驗證與 PowerShell 第 7 節目的
相同。CI 建立後，建議把這段跨平台檢查固定在 workflow，避免手動修改 JSON
路徑時混淆 Git Bash path 與 Windows path。
