import type { DateTimeRangeLocaleText } from "@ntustray/react-datetime-range-picker";

export type DemoLocale = "zh-TW" | "en-US" | "ja-JP";

interface LocaleOption {
  value: DemoLocale;
  label: string;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en-US", label: "English (US)" },
  { value: "ja-JP", label: "日本語" },
];

export const LOCALE_TEXT: Record<
  DemoLocale,
  Partial<DateTimeRangeLocaleText>
> = {
  "en-US": {},
  "zh-TW": {
    triggerLabel: "選擇日期與時間範圍",
    calendarLabel: "日曆",
    startLabel: "開始",
    endLabel: "結束",
    previousMonthLabel: "上個月",
    nextMonthLabel: "下個月",
    timezoneLabel: "時區",
    applyButtonLabel: "套用",
    cancelButtonLabel: "取消",
    clearButtonLabel: "清除",
    startTimeLabel: "開始時間",
    endTimeLabel: "結束時間",
    startOffsetLabel: "開始時間的 UTC 偏移",
    endOffsetLabel: "結束時間的 UTC 偏移",
    chooseOffsetLabel: "選擇 UTC 偏移",
    earlierOffsetLabel: "較早",
    laterOffsetLabel: "較晚",
    startDateStatusLabel: "開始日期",
    endDateStatusLabel: "結束日期",
    inRangeStatusLabel: "範圍內",
    validationEndWithoutStart: "請先選擇開始時間。",
    validationEndNotAfterStart: "結束時間必須晚於開始時間。",
    validationBeforeMinimum: "選擇的時間早於允許的最早時間。",
    validationAfterMaximum: "選擇的時間晚於允許的最晚時間。",
    validationMaximumDurationExceeded: "選擇的範圍超過允許長度。",
    validationMinuteStepMismatch: "分鐘不符合指定間隔。",
    validationSecondStepMismatch: "秒數不符合指定間隔。",
    validationMillisecondStepMismatch: "毫秒不符合指定間隔。",
    validationRequired: "請選擇日期與時間範圍。",
    validationInvalidText: "請輸入有效的日期與時間。",
    validationInvalidTimezone: "請選擇有效的 IANA 時區。",
    validationNonexistentLocalTime: "此本地時間不存在。",
    validationAmbiguousLocalTime: "此時間重複，請選擇 UTC 偏移。",
  },
  "ja-JP": {
    triggerLabel: "日時範囲を選択",
    calendarLabel: "カレンダー",
    startLabel: "開始",
    endLabel: "終了",
    previousMonthLabel: "前の月",
    nextMonthLabel: "次の月",
    timezoneLabel: "タイムゾーン",
    applyButtonLabel: "適用",
    cancelButtonLabel: "キャンセル",
    clearButtonLabel: "クリア",
    startTimeLabel: "開始時刻",
    endTimeLabel: "終了時刻",
    startOffsetLabel: "開始時刻の UTC オフセット",
    endOffsetLabel: "終了時刻の UTC オフセット",
    chooseOffsetLabel: "UTC オフセットを選択",
    earlierOffsetLabel: "早い方",
    laterOffsetLabel: "遅い方",
    startDateStatusLabel: "開始日",
    endDateStatusLabel: "終了日",
    inRangeStatusLabel: "範囲内",
    validationEndWithoutStart: "先に開始時刻を選択してください。",
    validationEndNotAfterStart: "終了時刻は開始時刻より後にしてください。",
    validationBeforeMinimum: "選択した時刻は最小値より前です。",
    validationAfterMaximum: "選択した時刻は最大値より後です。",
    validationMaximumDurationExceeded: "選択範囲が許容期間を超えています。",
    validationMinuteStepMismatch: "分が指定間隔と一致しません。",
    validationSecondStepMismatch: "秒が指定間隔と一致しません。",
    validationMillisecondStepMismatch: "ミリ秒が指定間隔と一致しません。",
    validationRequired: "日時範囲を選択してください。",
    validationInvalidText: "有効な日時を入力してください。",
    validationInvalidTimezone: "有効な IANA タイムゾーンを選択してください。",
    validationNonexistentLocalTime: "このローカル時刻は存在しません。",
    validationAmbiguousLocalTime:
      "この時刻は重複しています。UTC オフセットを選択してください。",
  },
};
