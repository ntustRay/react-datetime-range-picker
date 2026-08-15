# Localization Guide

The picker includes ten interface languages and uses the `locale` prop for
both `Intl` date formatting and built-in visible/accessibility text.

| `locale` | Language                |
| -------- | ----------------------- |
| `en-US`  | English (United States) |
| `zh-TW`  | Traditional Chinese     |
| `zh-CN`  | Simplified Chinese      |
| `ja-JP`  | Japanese                |
| `ko-KR`  | Korean                  |
| `es-ES`  | Spanish                 |
| `fr-FR`  | French                  |
| `de-DE`  | German                  |
| `pt-BR`  | Portuguese (Brazil)     |
| `ru-RU`  | Russian                 |

The default is `en-US`.

The translations have been compared with primary open-source picker locale
sources, but each language still requires a fluent or native review of the
complete rendered and screen-reader context before release approval. See the
[terminology research](LOCALIZATION_REFERENCE_RESEARCH.md) for the evidence,
applied corrections, and remaining caveats. Consumers can use `localeText` to
replace product-specific wording at any time.

## Set a fixed language

Pass a BCP 47 language tag to `locale`. No translation import or provider is
required.

```tsx
<DateTimeRangePicker
  value={value}
  onChange={setValue}
  onCommit={saveValue}
  locale="zh-TW"
/>
```

The language tag also controls month names, weekday names, and calendar labels
through the browser's `Intl.DateTimeFormat` implementation.

## Let the user change language manually

Keep the selected locale in React state and pass it to the picker.

```tsx
import { useState } from "react";
import {
  BUILT_IN_LOCALES,
  DateTimeRangePicker,
  type BuiltInLocale,
  type DateTimeRangeValue,
} from "@ntustray/react-datetime-range-picker";

const languageNames: Record<BuiltInLocale, string> = {
  "en-US": "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  "ja-JP": "日本語",
  "ko-KR": "한국어",
  "es-ES": "Español",
  "fr-FR": "Français",
  "de-DE": "Deutsch",
  "pt-BR": "Português (Brasil)",
  "ru-RU": "Русский",
};

export function LocalizedRangePicker(): React.JSX.Element {
  const [locale, setLocale] = useState<BuiltInLocale>("zh-TW");
  const [value, setValue] = useState<DateTimeRangeValue>({
    startTimestamp: null,
    endTimestamp: null,
  });

  return (
    <>
      <label>
        語言
        <select
          value={locale}
          onChange={(event) => {
            const nextLocale = BUILT_IN_LOCALES.find(
              (candidate) => candidate === event.currentTarget.value,
            );
            if (nextLocale !== undefined) setLocale(nextLocale);
          }}
        >
          {BUILT_IN_LOCALES.map((option) => (
            <option key={option} value={option}>
              {languageNames[option]}
            </option>
          ))}
        </select>
      </label>

      <DateTimeRangePicker
        value={value}
        onChange={setValue}
        onCommit={setValue}
        locale={locale}
      />
    </>
  );
}
```

## Locale matching and fallback

Regional variants use the matching built-in language. For example, `fr-CA`
uses French interface text while `Intl` still formats dates as Canadian
French. Chinese script and region tags are handled separately: `zh-Hant`,
`zh-HK`, and `zh-MO` use Traditional Chinese; `zh`, `zh-Hans`, and `zh-SG` use
Simplified Chinese. Other unsupported languages fall back to English interface
text while their valid BCP 47 tag continues to control `Intl` date formatting.

## Override individual labels

Use `localeText` when product wording differs from the built-in translation.
It is a partial override, so omitted fields continue to use the language chosen
by `locale`.

```tsx
<DateTimeRangePicker
  value={value}
  onChange={setValue}
  onCommit={saveValue}
  locale="zh-TW"
  localeText={{
    applyButtonLabel: "確認",
    validationRequired: "請選擇查詢期間。",
  }}
/>
```

For a completely custom language, pass its valid BCP 47 tag to `locale` and
provide all `DateTimeRangeLocaleText` fields through `localeText`. Format hints
may be omitted to retain the picker-generated date/time pattern.
