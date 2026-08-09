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
  const [, setCommitted] = useState(emptyRange);

  return (
    <DateTimeRangePicker
      value={draft}
      onChange={setDraft}
      onCommit={setCommitted}
      timezone="UTC"
    />
  );
}
