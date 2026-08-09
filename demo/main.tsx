import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DateTimeRangePicker,
  type DateTimeRangeValue,
  type Precision,
} from "@ntustray/react-datetime-range-picker";
import "@ntustray/react-datetime-range-picker/styles.css";
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

function isPrecision(value: string): value is Precision {
  return PRECISIONS.some((precision) => precision === value);
}

function Demo(): React.JSX.Element {
  const [value, setValue] = useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [committed, setCommitted] = useState<DateTimeRangeValue>(EMPTY_RANGE);
  const [precision, setPrecision] = useState<Precision>("second");

  return (
    <section className="demo-shell">
      <p className="demo-eyebrow">Timestamp controls</p>
      <h1>Filter a chart by local time.</h1>
      <p className="demo-intro">
        Draft edits stay local until Apply commits a half-open epoch-millisecond
        range.
      </p>
      <label className="demo-select">
        Precision
        <select
          value={precision}
          onChange={(event) => {
            const nextPrecision = event.currentTarget.value;
            if (isPrecision(nextPrecision)) setPrecision(nextPrecision);
          }}
        >
          <option value="minute">Minute</option>
          <option value="second">Second</option>
          <option value="millisecond">Millisecond</option>
        </select>
      </label>
      <DateTimeRangePicker
        value={value}
        precision={precision}
        onChange={setValue}
        onCommit={setCommitted}
        timezone="UTC"
        locale="zh-TW"
        timezoneOptions={["UTC", "Asia/Taipei", "America/New_York"]}
      />
      <div className="demo-examples">
        <h2>Configuration examples</h2>
        <DateTimeRangePicker
          value={value}
          onChange={setValue}
          onCommit={setCommitted}
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
              label: "Today",
              getValue: ({ nowTimestamp }) => ({
                startTimestamp: nowTimestamp - 86_400_000,
                endTimestamp: nowTimestamp,
              }),
            },
          ]}
          labels={{ trigger: "Constrained range", apply: "Use range" }}
          testIds={{ root: "dtrp-constrained" }}
        />
        <DateTimeRangePicker
          value={EMPTY_RANGE}
          onChange={() => undefined}
          onCommit={() => undefined}
          labels={{ trigger: "Disabled range" }}
          disabled
        />
        <DateTimeRangePicker
          value={EMPTY_RANGE}
          onChange={() => undefined}
          onCommit={() => undefined}
          labels={{ trigger: "Read-only range" }}
          readOnly
        />
        <DateTimeRangePicker
          value={{
            startTimestamp: Date.UTC(2024, 2, 10, 7, 30),
            endTimestamp: Date.UTC(2024, 2, 10, 8, 30),
          }}
          onChange={() => undefined}
          onCommit={() => undefined}
          timezone="America/New_York"
          labels={{ trigger: "DST gap example" }}
        />
        <DateTimeRangePicker
          value={{ startTimestamp: Date.UTC(2026, 7, 2), endTimestamp: Date.UTC(2026, 7, 1) }}
          onChange={() => undefined}
          onCommit={() => undefined}
          labels={{ trigger: "Invalid controlled value" }}
        />
        <DateTimeRangePicker
          value={EMPTY_RANGE}
          onChange={() => undefined}
          onCommit={() => undefined}
          timezone="America/New_York"
          labels={{ trigger: "DST overlap example" }}
        />
      </div>
      <dl className="demo-status">
        <div>
          <dt>Draft</dt>
          <dd>{JSON.stringify(value)}</dd>
        </div>
        <div>
          <dt>Committed chart filter</dt>
          <dd>{JSON.stringify(committed)}</dd>
        </div>
      </dl>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
