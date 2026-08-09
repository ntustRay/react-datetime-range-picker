import { useState } from "react";
import {
  DateTimeRangePicker,
  type DateTimeRangeValue,
} from "@ntustray/react-datetime-range-picker";
import "@ntustray/react-datetime-range-picker/styles.css";

export function App(): React.JSX.Element {
  const [value, setValue] = useState<DateTimeRangeValue>({
    startTimestamp: null,
    endTimestamp: null,
  });
  return (
    <DateTimeRangePicker
      value={value}
      onChange={setValue}
      onCommit={setValue}
    />
  );
}
