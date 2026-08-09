import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { DateTimeRangePicker } from "@ntustray/react-datetime-range-picker";

const html = renderToString(
  createElement(DateTimeRangePicker, {
    value: { startTimestamp: null, endTimestamp: null },
    onChange: () => undefined,
    onCommit: () => undefined,
  }),
);

if (!html.includes('aria-label="Open calendar"')) {
  throw new Error("The packed picker did not render its accessible trigger.");
}
