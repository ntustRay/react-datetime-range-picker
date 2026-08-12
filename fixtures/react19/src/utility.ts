import { normalizeTimestamp } from "@ntustray/react-datetime-range-picker";

export function normalizeForConsumer(timestamp: number): number {
  return normalizeTimestamp(timestamp, { precision: "second" });
}
