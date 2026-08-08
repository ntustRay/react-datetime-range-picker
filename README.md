# React DateTime Range Picker

An accessible React date-time range picker designed for timestamp-based chart
filters. The package will use Unix epoch milliseconds, display values in a
selectable IANA time zone, and default to UTC.

## Status

The project is currently in the implementation stage. The package scaffold and
test harness are in place; product behavior has not been implemented yet. The
agreed behavior is documented in [docs/CONTEXT.md](docs/CONTEXT.md). See
[docs/TODO.md](docs/TODO.md) for the implementation backlog and
[docs/WORKFLOW.md](docs/WORKFLOW.md) for the autonomous TDD loop.

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

## Tooling

- npm for package management
- tsdown for the publishable ESM library build
- Vite for the demo application
- TypeScript in strict mode
- Vitest and React Testing Library for unit and component tests
- Playwright for end-to-end tests

Use Node 24 and npm 11. Run `npm run check` for type checking, tests, and the
publishable library build.

## License

[MIT](LICENSE)
