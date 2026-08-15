import type { BuiltInLocale } from "@ntustray/react-datetime-range-picker";

interface LocaleOption {
  value: BuiltInLocale;
  label: string;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { value: "en-US", label: "English (US)" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "zh-CN", label: "简体中文" },
  { value: "ja-JP", label: "日本語" },
  { value: "ko-KR", label: "한국어" },
  { value: "es-ES", label: "Español" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "ru-RU", label: "Русский" },
];

export function isDemoLocale(value: string): value is BuiltInLocale {
  return LOCALE_OPTIONS.some((option) => option.value === value);
}
