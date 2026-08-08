interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

interface LocalDateTimeCandidate {
  timestamp: number;
  offsetMinutes: number;
}

type LocalDateTimeResolutionStatus = "exact" | "ambiguous" | "nonexistent";

interface LocalDateTimeResolution {
  status: LocalDateTimeResolutionStatus;
  candidates: readonly LocalDateTimeCandidate[];
}

const OFFSET_SEARCH_WINDOW_HOURS = 36;
const MILLISECONDS_PER_HOUR = 3_600_000;
const MILLISECONDS_PER_MINUTE = 60_000;

function createFormatter(timezone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US-u-ca-gregory", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

export function validateTimezone(timezone: string): void {
  createFormatter(timezone).format(0);
}

export function getLocalDateTime(
  timestamp: number,
  timezone: string,
): LocalDateTime {
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;
  let hour: number | null = null;
  let minute: number | null = null;
  let second: number | null = null;

  for (const part of createFormatter(timezone).formatToParts(timestamp)) {
    const value = Number(part.value);
    if (part.type === "year") year = value;
    if (part.type === "month") month = value;
    if (part.type === "day") day = value;
    if (part.type === "hour") hour = value;
    if (part.type === "minute") minute = value;
    if (part.type === "second") second = value;
  }

  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    second === null
  ) {
    throw new RangeError("Unable to format timestamp in the selected timezone.");
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond: ((timestamp % 1_000) + 1_000) % 1_000,
  };
}

function localAsUtc(parts: LocalDateTime): number {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return date.getTime();
}

function sameLocalDateTime(left: LocalDateTime, right: LocalDateTime): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second &&
    left.millisecond === right.millisecond
  );
}

export function getTimezoneOffsetMinutes(
  timestamp: number,
  timezone: string,
): number {
  return (localAsUtc(getLocalDateTime(timestamp, timezone)) - timestamp) /
    MILLISECONDS_PER_MINUTE;
}

export function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function resolveLocalDateTime(
  parts: LocalDateTime,
  timezone: string,
): LocalDateTimeResolution {
  validateTimezone(timezone);
  const localTimestamp = localAsUtc(parts);
  const offsets = new Set<number>();

  for (
    let hour = -OFFSET_SEARCH_WINDOW_HOURS;
    hour <= OFFSET_SEARCH_WINDOW_HOURS;
    hour += 1
  ) {
    offsets.add(
      getTimezoneOffsetMinutes(
        localTimestamp + hour * MILLISECONDS_PER_HOUR,
        timezone,
      ),
    );
  }

  const candidates: LocalDateTimeCandidate[] = [];
  for (const offsetMinutes of offsets) {
    const timestamp = localTimestamp - offsetMinutes * MILLISECONDS_PER_MINUTE;
    if (sameLocalDateTime(getLocalDateTime(timestamp, timezone), parts)) {
      candidates.push({ timestamp, offsetMinutes });
    }
  }
  candidates.sort((left, right) => left.timestamp - right.timestamp);

  return {
    status:
      candidates.length === 0
        ? "nonexistent"
        : candidates.length === 1
          ? "exact"
          : "ambiguous",
    candidates,
  };
}

export type {
  LocalDateTime,
  LocalDateTimeCandidate,
  LocalDateTimeResolution,
  LocalDateTimeResolutionStatus,
};
