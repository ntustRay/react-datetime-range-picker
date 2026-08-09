import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DateTimeRangePicker,
  type ColorScheme,
  type DateTimeRangeChangeHandler,
  type DateTimeRangeValidationResult,
  type DateTimeRangeValue,
  type HourCycle,
  type Precision,
  type Timezone,
  type Weekday,
} from "@ntustray/react-datetime-range-picker";
import "@ntustray/react-datetime-range-picker/styles.css";
import { LOCALE_OPTIONS, LOCALE_TEXT, type DemoLocale } from "./locale-text.js";
import "./styles.css";

const EMPTY_RANGE: DateTimeRangeValue = {
  startTimestamp: null,
  endTimestamp: null,
};

const PRECISIONS: readonly Precision[] = [
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "millisecond",
];

const WEEKDAYS: readonly Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const TIMEZONES: readonly Timezone[] = [
  "UTC",
  "Asia/Taipei",
  "America/New_York",
];

const COLOR_SCHEMES: readonly ColorScheme[] = ["light", "dark"];

interface ScenarioProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const ignoreRangeChange: DateTimeRangeChangeHandler = () => undefined;

function isPrecision(value: string): value is Precision {
  return PRECISIONS.some((precision) => precision === value);
}

function isWeekday(value: string): value is Weekday {
  return WEEKDAYS.some((weekday) => weekday === value);
}

function isDemoLocale(value: string): value is DemoLocale {
  return LOCALE_OPTIONS.some((option) => option.value === value);
}

function isColorScheme(value: string): value is ColorScheme {
  return COLOR_SCHEMES.some((colorScheme) => colorScheme === value);
}

function formatValue(value: DateTimeRangeValue): string {
  if (value.startTimestamp === null || value.endTimestamp === null) {
    return "No complete range";
  }
  const durationHours = (value.endTimestamp - value.startTimestamp) / 3_600_000;
  return `${durationHours.toLocaleString()} hours · ${value.startTimestamp} → ${value.endTimestamp}`;
}

function Scenario(props: ScenarioProps): React.JSX.Element {
  return (
    <article className="scenario-card">
      <div>
        <h3>{props.title}</h3>
        <p>{props.description}</p>
      </div>
      <div className="scenario-control">{props.children}</div>
    </article>
  );
}

function Hero(): React.JSX.Element {
  return (
    <header className="hero">
      <nav aria-label="Package links">
        <span className="package-mark">@ntustray / date-time range</span>
        <a href="https://www.npmjs.com/package/@ntustray/react-datetime-range-picker">
          npm package ↗
        </a>
      </nav>
      <div className="hero-copy">
        <p className="demo-eyebrow">
          React component · ESM · zero runtime dependencies
        </p>
        <h1>
          Time ranges,
          <br />
          without time traps.
        </h1>
        <p className="demo-intro">
          An accessible controlled picker for timestamp-based chart filters,
          with explicit timezone, precision, and validation behavior.
        </p>
        <div className="install-command" aria-label="Install command">
          <span aria-hidden="true">$</span>
          <code>npm install @ntustray/react-datetime-range-picker</code>
        </div>
      </div>
      <dl className="package-facts">
        <div>
          <dt>Value</dt>
          <dd>Epoch milliseconds</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>Half-open [start, end)</dd>
        </div>
        <div>
          <dt>React</dt>
          <dd>18 and 19</dd>
        </div>
      </dl>
    </header>
  );
}

function Playground(): React.JSX.Element {
  const [value, setValue] = useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [committed, setCommitted] = useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [precision, setPrecision] = useState<Precision>("second");
  const [timezone, setTimezone] = useState<Timezone>("UTC");
  const [hourCycle, setHourCycle] = useState<HourCycle>("h24");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const [locale, setLocale] = useState<DemoLocale>("zh-TW");
  const [firstWeekday, setFirstWeekday] = useState<Weekday>("sunday");
  const [required, setRequired] = useState(false);
  const [clearable, setClearable] = useState(true);
  const [validation, setValidation] = useState<DateTimeRangeValidationResult>({
    status: "empty",
    errors: [],
  });

  return (
    <section className="playground" aria-labelledby="playground-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Interactive playground</p>
          <h2 id="playground-title">Try the complete workflow</h2>
        </div>
        <p>
          Change the product settings, pick a range, then Apply to commit it.
        </p>
      </div>

      <div className="playground-grid">
        <aside className="control-panel" aria-label="Picker configuration">
          <label>
            Precision
            <select
              value={precision}
              onChange={(event) => {
                if (isPrecision(event.currentTarget.value)) {
                  setPrecision(event.currentTarget.value);
                }
              }}
            >
              {PRECISIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Locale
            <select
              value={locale}
              onChange={(event) => {
                if (isDemoLocale(event.currentTarget.value)) {
                  setLocale(event.currentTarget.value);
                }
              }}
            >
              {LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Week starts on
            <select
              value={firstWeekday}
              onChange={(event) => {
                if (isWeekday(event.currentTarget.value)) {
                  setFirstWeekday(event.currentTarget.value);
                }
              }}
            >
              {WEEKDAYS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Theme
            <select
              value={colorScheme}
              onChange={(event) => {
                if (isColorScheme(event.currentTarget.value)) {
                  setColorScheme(event.currentTarget.value);
                }
              }}
            >
              {COLOR_SCHEMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={required}
                onChange={(event) => setRequired(event.currentTarget.checked)}
              />
              Required
            </label>
            <label>
              <input
                type="checkbox"
                checked={clearable}
                onChange={(event) => setClearable(event.currentTarget.checked)}
              />
              Reset action
            </label>
          </div>
        </aside>

        <div className="picker-stage">
          <div className="stage-label">
            <span>Live component</span>
            <span>
              {timezone} · {colorScheme}
            </span>
          </div>
          <DateTimeRangePicker
            value={value}
            precision={precision}
            onChange={setValue}
            onCommit={setCommitted}
            onValidationChange={setValidation}
            timezone={timezone}
            onTimezoneChange={setTimezone}
            hourCycle={hourCycle}
            onHourCycleChange={setHourCycle}
            colorScheme={colorScheme}
            locale={locale}
            localeText={LOCALE_TEXT[locale]}
            firstWeekday={firstWeekday}
            required={required}
            clearable={clearable}
            timezoneOptions={TIMEZONES}
          />
          <div className="state-readout" aria-live="polite">
            <div>
              <span>Draft · {validation.status}</span>
              <code>{formatValue(value)}</code>
            </div>
            <div>
              <span>Committed chart filter</span>
              <code>{formatValue(committed)}</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickStart(): React.JSX.Element {
  return (
    <section className="quick-start" aria-labelledby="quick-start-title">
      <div>
        <p className="section-kicker">Two-state contract</p>
        <h2 id="quick-start-title">Draft freely. Commit deliberately.</h2>
        <p>
          The picker stays controlled: <code>onChange</code> reports every
          draft, while <code>onCommit</code> runs only when Apply receives a
          complete, valid range.
        </p>
      </div>
      <pre>
        <code>{`const [draft, setDraft] = useState(emptyRange);

<DateTimeRangePicker
  value={draft}
  onChange={setDraft}
  onCommit={applyChartFilter}
  timezone="UTC"
/>`}</code>
      </pre>
    </section>
  );
}

function ProductionScenarios(): React.JSX.Element {
  const [constrainedValue, setConstrainedValue] =
    useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [textOnlyValue, setTextOnlyValue] =
    useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [calendarOnlyValue, setCalendarOnlyValue] =
    useState<DateTimeRangeValue>(EMPTY_RANGE);

  return (
    <section className="scenarios" aria-labelledby="scenarios-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Configuration matrix</p>
          <h2 id="scenarios-title">Production scenarios</h2>
        </div>
        <p>
          Each example owns its state, so experiments never leak between cases.
        </p>
      </div>
      <div className="scenario-grid">
        <Scenario
          title="Guardrailed reporting window"
          description="Required, limited to 2026, capped at seven days, stepped inputs, with a rolling preset."
        >
          <DateTimeRangePicker
            value={constrainedValue}
            onChange={setConstrainedValue}
            onCommit={setConstrainedValue}
            required
            constraints={{
              minTimestamp: Date.UTC(2026, 0, 1),
              maxTimestamp: Date.UTC(2027, 0, 1),
              maxDurationMilliseconds: 7 * 86_400_000,
            }}
            steps={{ minute: 5, second: 10, millisecond: 100 }}
            presets={[
              {
                id: "today",
                label: "Last 24 hours",
                getValue: ({ nowTimestamp }) => ({
                  startTimestamp: nowTimestamp - 86_400_000,
                  endTimestamp: nowTimestamp,
                }),
              },
            ]}
            localeText={{
              triggerLabel: "Constrained range",
              applyButtonLabel: "Use range",
            }}
            testIds={{ root: "dtrp-constrained" }}
          />
        </Scenario>
        <Scenario
          title="Text-only toolbar"
          description="For dense filter bars where the calendar would interrupt the workflow."
        >
          <DateTimeRangePicker
            value={textOnlyValue}
            onChange={setTextOnlyValue}
            onCommit={setTextOnlyValue}
            features={{
              calendar: false,
              textInput: true,
              timezoneSelector: false,
            }}
            localeText={{ triggerLabel: "Enter exact range" }}
          />
        </Scenario>
        <Scenario
          title="Calendar-only selection"
          description="A simpler day-level picker with text editing and timezone controls removed."
        >
          <DateTimeRangePicker
            value={calendarOnlyValue}
            onChange={setCalendarOnlyValue}
            onCommit={setCalendarOnlyValue}
            precision="day"
            features={{
              calendar: true,
              textInput: false,
              timezoneSelector: false,
            }}
            localeText={{ triggerLabel: "Choose reporting days" }}
          />
        </Scenario>
        <Scenario
          title="Unavailable controls"
          description="Disabled and read-only states remain visibly distinct and cannot open."
        >
          <div className="scenario-stack">
            <DateTimeRangePicker
              value={EMPTY_RANGE}
              onChange={ignoreRangeChange}
              onCommit={ignoreRangeChange}
              localeText={{ triggerLabel: "Disabled range" }}
              disabled
            />
            <DateTimeRangePicker
              value={EMPTY_RANGE}
              onChange={ignoreRangeChange}
              onCommit={ignoreRangeChange}
              localeText={{ triggerLabel: "Read-only range" }}
              readOnly
            />
          </div>
        </Scenario>
      </div>
    </section>
  );
}

function EdgeCases(): React.JSX.Element {
  const [gapValue, setGapValue] = useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [overlapValue, setOverlapValue] =
    useState<DateTimeRangeValue>(EMPTY_RANGE);

  return (
    <section className="edge-cases" aria-labelledby="edge-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Timezone and validation lab</p>
          <h2 id="edge-title">Make failure inspectable</h2>
        </div>
        <p>
          Open a case to see how invalid ranges and DST boundaries are
          communicated.
        </p>
      </div>
      <div className="edge-list">
        <Scenario
          title="Spring-forward gap"
          description="Enter 2024/03/10 02:30:00. New York skips that local time, so the picker explains the gap."
        >
          <DateTimeRangePicker
            value={gapValue}
            onChange={setGapValue}
            onCommit={setGapValue}
            timezone="America/New_York"
            localeText={{ triggerLabel: "DST gap example" }}
          />
        </Scenario>
        <Scenario
          title="Invalid controlled range"
          description="The end is earlier than the start, so Apply stays unavailable and validation explains why."
        >
          <DateTimeRangePicker
            value={{
              startTimestamp: Date.UTC(2026, 7, 2),
              endTimestamp: Date.UTC(2026, 7, 1),
            }}
            onChange={ignoreRangeChange}
            onCommit={ignoreRangeChange}
            localeText={{ triggerLabel: "Invalid controlled value" }}
          />
        </Scenario>
        <Scenario
          title="Fall-back overlap"
          description="Enter 2024/11/03 01:30:00 to choose between the repeated local-time offsets."
        >
          <DateTimeRangePicker
            value={overlapValue}
            onChange={setOverlapValue}
            onCommit={setOverlapValue}
            timezone="America/New_York"
            localeText={{ triggerLabel: "DST overlap example" }}
          />
        </Scenario>
      </div>
    </section>
  );
}

function Footer(): React.JSX.Element {
  return (
    <footer>
      <span>MIT licensed · no runtime dependencies</span>
      <a href="https://github.com/ntustRay/react-datetime-range-picker">
        View source on GitHub ↗
      </a>
    </footer>
  );
}

function Demo(): React.JSX.Element {
  return (
    <main>
      <Hero />
      <Playground />
      <QuickStart />
      <ProductionScenarios />
      <EdgeCases />
      <Footer />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
