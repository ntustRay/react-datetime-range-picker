// @vitest-environment node

import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";

import { DateTimeRangePicker } from "@ntustray/react-datetime-range-picker";

test("public picker renders without browser globals", () => {
  const html = renderToString(
    <DateTimeRangePicker
      value={{ startTimestamp: null, endTimestamp: null }}
      onChange={() => undefined}
      onCommit={() => undefined}
    />,
  );

  expect(html).toContain('aria-label="Open calendar"');
});
