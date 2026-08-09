# React DateTime Range Picker

[![CI](https://github.com/ntustRay/react-datetime-range-picker/actions/workflows/ci.yml/badge.svg)](https://github.com/ntustRay/react-datetime-range-picker/actions/workflows/ci.yml)

An accessible controlled React date-time range picker for timestamp-based
chart filters. Values are Unix epoch milliseconds, displayed in a selectable
IANA timezone, with UTC as the default.

## Install

```sh
npm install @ntustray/react-datetime-range-picker
```

Import the stylesheet once:

```ts
import "@ntustray/react-datetime-range-picker/styles.css";
```

## Minimal controlled example

```tsx
import { useState } from "react";
import {
  DateTimeRangePicker,
  type DateTimeRangeValue,
} from "@ntustray/react-datetime-range-picker";
import "@ntustray/react-datetime-range-picker/styles.css";

const emptyRange: DateTimeRangeValue = {
  startTimestamp: null,
  endTimestamp: null,
};

export function FilterControl(): React.JSX.Element {
  const [draft, setDraft] = useState(emptyRange);
  const [committed, setCommitted] = useState(emptyRange);

  return (
    <DateTimeRangePicker
      value={draft}
      onChange={setDraft}
      onCommit={setCommitted}
      timezone="UTC"
    />
  );
}
```

The Start and End fields accept local text in `YYYY/MM/DD HH:mm:ss` format and
parse 300 ms after typing stops. Start opens first; Next switches the same
single-panel popover to End; Apply then accepts a complete range. The year and
month header controls switch that panel to direct year or month selection.
`onChange`
receives valid draft edits, while `onCommit` is Apply-only. Ranges use half-open semantics:
`startTimestamp <= timestamp < endTimestamp`. Clearing produces two explicit
`null` fields.

The complete picker floats over surrounding content by default. Set
`popoverMode="inline"` when it should expand in normal document flow instead.
Click an already-open year or month heading to return without selecting.

Formatting and wording are separate. Pass a BCP 47 tag through `locale`, and
replace any UI wording key through `localeText`; omitted wording keys keep the
English defaults:

```tsx
<DateTimeRangePicker
  locale="zh-TW"
  localeText={{ calendarButtonLabel: "開啟日曆", applyButtonLabel: "套用" }}
  // value, onChange, and onCommit omitted here for brevity
/>
```

The default display timezone is UTC. Changing the controlled timezone changes
display and editing only; it does not change represented instants. Precision
defaults to seconds and supports year, month, day, hour, minute, second, and
millisecond. Units below the selected precision normalize to zero.
The controlled `hourCycle` prop accepts `"h12"` or `"h24"`; omitted values
default to 24-hour text and columns.
Set `colorScheme` to `"light"` or `"dark"` for an explicit component theme;
the default is always `"light"`.

Constraints, steps, presets, localization, validation formatting, stable test
IDs, feature visibility, and disabled/read-only/required behavior are documented
in [docs/PUBLIC_API.md](docs/PUBLIC_API.md). The product and accessibility
contract is in [docs/CONTEXT.md](docs/CONTEXT.md).
CI ownership, pre-release auditing, and npm publication are covered by the
[CI and npm release guide](docs/CI_AND_NPM_RELEASE_GUIDE.md).
For a local Windows build without publishing, follow the
[manual build guide](docs/MANUAL_BUILD_GUIDE.md).

## Development

```sh
npm run lint          # ESLint with zero warnings allowed
npm run format        # format supported files with Prettier
npm run format:check  # verify Prettier formatting without writing
npm run check         # lint, format check, typecheck, tests, and package build
npm run demo:build    # build the Vite demo
npm run demo          # serve the demo locally
```

The package is ESM-only, has no runtime dependencies, and supports React 18
and React 19 as peer dependencies. Date calculations avoid direct browser
globals so server-side React rendering remains safe.

## License

[MIT](LICENSE)
