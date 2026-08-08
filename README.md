# React DateTime Range Picker

An accessible React date-time range picker designed for timestamp-based chart
filters. The package will use Unix epoch milliseconds, display values in a
selectable IANA time zone, and default to UTC.

## Status

The project is currently in the product-definition stage. The agreed behavior
is documented in [docs/CONTEXT.md](docs/CONTEXT.md); implementation has not
started.

The planned public npm package name is:

```text
@ntustray/react-datetime-range-picker
```

## Product Direction

- Controlled React component for selecting a start and end timestamp
- Half-open ranges: `[start, end)`
- Configurable precision from year through millisecond, defaulting to second
- IANA time-zone display and editing, defaulting to UTC
- Calendar, text input, keyboard input, presets, and immediate validation
- Accessible interaction targeting WCAG 2.2 AA
- Stable, customizable `data-testid` attributes
- No runtime dependencies; React 18 and 19 as peer dependencies

## Planned Tooling

- npm for package management
- tsdown for the publishable ESM library build
- Vite for the demo application
- TypeScript in strict mode
- Vitest and React Testing Library for unit and component tests
- Playwright for end-to-end tests

Tooling will be introduced in a separate change after the product contract is
reviewed.

## License

[MIT](LICENSE)
