# React DateTime Range Picker

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

`onChange` receives draft edits. `onCommit` fires only after Apply accepts a
complete valid range. Ranges use half-open semantics:
`startTimestamp <= timestamp < endTimestamp`. Clearing produces two explicit
`null` fields.

Formatting and wording are separate. Pass a BCP 47 tag through `locale`, and
replace any UI wording key through `localeText`; omitted wording keys keep the
English defaults:

```tsx
<DateTimeRangePicker
  locale="zh-TW"
  localeText={{ triggerLabel: "選擇日期與時間範圍", applyButtonLabel: "套用" }}
  // value, onChange, and onCommit omitted here for brevity
/>
```

The default display timezone is UTC. Changing the controlled timezone changes
display and editing only; it does not change represented instants. Precision
defaults to seconds and supports year, month, day, hour, minute, second, and
millisecond. Units below the selected precision normalize to zero.

Constraints, steps, presets, localization, validation formatting, stable test
IDs, feature visibility, and disabled/read-only/required behavior are documented
in [docs/PUBLIC_API.md](docs/PUBLIC_API.md). The product and accessibility
contract is in [docs/CONTEXT.md](docs/CONTEXT.md).

## Development

```sh
npm run check       # typecheck, tests, and package build
npm run demo:build  # build the Vite demo
npm run demo        # serve the demo locally
```

The package is ESM-only, has no runtime dependencies, and supports React 18
and React 19 as peer dependencies. Date calculations avoid direct browser
globals so server-side React rendering remains safe.

## License

[MIT](LICENSE)
