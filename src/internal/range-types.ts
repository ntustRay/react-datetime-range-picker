import type { Timestamp } from "../types.js";

export interface CompleteDateTimeRangeValue {
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
}

export interface DraftDateTimeRangeValue {
  startTimestamp: Timestamp;
  endTimestamp: null;
}
