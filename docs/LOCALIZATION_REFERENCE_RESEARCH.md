# Localization terminology reference research

Research date: 2026-08-15

## Scope and method

This note compares the ten dictionaries in `src/locales.ts` with picker
terminology maintained by major component projects. The main reference is the
[MUI X picker locale source](https://github.com/mui/mui-x/tree/master/packages/x-date-pickers/src/locales),
because it distinguishes range endpoints, action-bar buttons, calendar
navigation, and time views. For Traditional Chinese and useful second opinions,
the comparison also uses Ant Design's date-picker dictionaries and the
underlying [rc-picker locale source](https://github.com/react-component/picker/tree/master/src/locale).
[Unicode CLDR locale data](https://github.com/unicode-org/cldr/tree/main/common/main)
is the reference for locale-specific day-period conventions.

These sources are evidence of established product terminology, not proof that
every upstream translation is ideal. In particular, `Clear` and `Reset` have
different behavior in this component, and its UTC-offset and DST validation
messages have no close equivalent in the compared pickers. No upstream string
should therefore be copied without checking its control semantics.

## Findings that justify changes

### 1. Make hour-cycle options name a display system, not a duration

Every locale currently translates `hourCycle12Label` and `hourCycle24Label` as
the equivalent of “12 hours” and “24 hours.” As standalone options, those can
sound like durations. The parent label helps visually, but each option should
also make sense when announced by assistive technology. Prefer the following
candidates:

| Locale  | 12-hour candidate     | 24-hour candidate     |
| ------- | --------------------- | --------------------- |
| `en-US` | `12-hour`             | `24-hour`             |
| `zh-TW` | `12 小時制`           | `24 小時制`           |
| `zh-CN` | `12 小时制`           | `24 小时制`           |
| `ja-JP` | `12 時間制`           | `24 時間制`           |
| `ko-KR` | `12시간제`            | `24시간제`            |
| `es-ES` | `Formato de 12 horas` | `Formato de 24 horas` |
| `fr-FR` | `Format 12 heures`    | `Format 24 heures`    |
| `de-DE` | `12-Stunden-Format`   | `24-Stunden-Format`   |
| `pt-BR` | `Formato de 12 horas` | `Formato de 24 horas` |
| `ru-RU` | `12-часовой формат`   | `24-часовой формат`   |

This is a semantic/accessibility correction; all non-English candidates still
need native review before merging.

### 2. Name the AM/PM column precisely

`periodColumnLabel` means the AM/PM selector, not an arbitrary period or range.
MUI X uses the locale equivalents of “meridiem” in its
[Spanish](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/esES.ts),
[French](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/frFR.ts),
and [Brazilian Portuguese](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/ptBR.ts)
dictionaries. The following replacements are better scoped than the current
generic labels:

- `en-US`: `Period` -> `AM/PM`
- `es-ES`: `Período` -> `Meridiano`
- `fr-FR`: `Période` -> `Méridien`
- `pt-BR`: `Período` -> `Meridiano`

The current East Asian labels already state AM/PM directly or use an ordinary
“time of day” term. German `Tageshälfte` is similarly explicit. Russian
`Период` is also vague, but MUI's `меридием` is not strong enough evidence for
an automatic replacement; a Russian reviewer should choose a spoken label such
as the local equivalent of “before/after noon.”

### 3. Keep `UTC` in offset labels in every language

The Asian dictionaries say `UTC` in `startOffsetLabel`, `endOffsetLabel`, and
`chooseOffsetLabel`; English, Spanish, French, German, Portuguese, and Russian
do not. These controls choose the UTC offset for a repeated local time, so the
omission makes an already unfamiliar choice less clear. Suggested wording:

| Locale  | Start / end pattern                                      | Picker prompt               |
| ------- | -------------------------------------------------------- | --------------------------- |
| `en-US` | `Start UTC offset` / `End UTC offset`                    | `Choose a UTC offset`       |
| `es-ES` | `Desfase UTC de inicio` / `Desfase UTC de fin`           | `Elegir un desfase UTC`     |
| `fr-FR` | `Décalage UTC de début` / `Décalage UTC de fin`          | `Choisir un décalage UTC`   |
| `de-DE` | `UTC-Versatz der Startzeit` / `UTC-Versatz der Endzeit`  | `UTC-Versatz auswählen`     |
| `pt-BR` | `Deslocamento UTC inicial` / `Deslocamento UTC final`    | `Escolher deslocamento UTC` |
| `ru-RU` | `Смещение UTC для начала` / `Смещение UTC для окончания` | `Выбрать смещение UTC`      |

The product meaning justifies adding `UTC`; the exact grammar needs native
review in all six listed locales.

### 4. Correct the Russian range noun

`Выбрать диапазон даты и времени` and
`Требуется диапазон даты и времени` use singular genitive `даты` after
`диапазон`. A date range is conventionally expressed with plural genitive
`дат`; Ant Design also labels its endpoints as `Начальная дата` and
`Конечная дата` in its
[Russian date-picker source](https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/ru_RU.ts),
while MUI avoids the construction with `Выбрать период` in its
[Russian picker locale](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/ruRU.ts).
Use `Выбрать диапазон дат и времени` and
`Требуется диапазон дат и времени` as correction candidates, subject to a
Russian native review of the complete sentences.

## Locale-by-locale comparison

| Locale  | Concrete comparison                                                                                                                                                                                                                                                                                                                                                           | Recommendation                                                                                                                                                                          | Native/fluent review                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `en-US` | Previous/next month, start/end, Cancel/Clear/Next, and time-field terms match [MUI X English](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/enUS.ts).                                                                                                                                                                                          | Apply the hour-cycle, AM/PM-column, and explicit-UTC changes above.                                                                                                                     | **Required** for the final accessibility wording and all custom validation/DST messages. |
| `zh-TW` | `上個月`/`下個月`, `選擇月份`/`選擇年份`, `清除`, and `開始日期`/`結束日期` agree with [rc-picker zh-TW](https://github.com/react-component/picker/blob/master/src/locale/zh_TW.ts) and [Ant Design zh-TW](https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/zh_TW.ts).                                                                      | Apply the hour-cycle clarification. Review whether the two DST messages should use Taiwan-preferred `當地時間` instead of `本地時間`; evidence is insufficient for an automatic change. | **Required**, especially for Taiwan usage, year-page labels, and DST wording.            |
| `zh-CN` | Calendar navigation, endpoints, actions, and time units closely match [MUI X zh-CN](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/zhCN.ts) and [rc-picker zh-CN](https://github.com/react-component/picker/blob/master/src/locale/zh_CN.ts).                                                                                                   | Apply only the hour-cycle clarification from this research.                                                                                                                             | **Required** for the custom constraints and DST messages.                                |
| `ja-JP` | Start/end and action labels match [MUI X ja-JP](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/jaJP.ts). MUI uses `先月`/`来月`, while [rc-picker ja-JP](https://github.com/react-component/picker/blob/master/src/locale/ja_JP.ts) uses `前月`/`翌月`; this variation does not make the current `前の月`/`次の月` wrong.                       | Apply the hour-cycle clarification; do not change month navigation solely to mimic one upstream.                                                                                        | **Required**, especially for `前の年一覧`/`次の年一覧` and technical DST phrasing.       |
| `ko-KR` | Core labels match [MUI X ko-KR](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/koKR.ts). MUI uses `초기화` for its clear action, whereas [rc-picker ko-KR](https://github.com/react-component/picker/blob/master/src/locale/ko_KR.ts) uses `지우기`; the current distinction between Clear and Reset should decide this, not source popularity. | Apply the hour-cycle clarification. Keep `지우기` pending a contextual native decision.                                                                                                 | **Required**, including Clear versus Reset and all DST messages.                         |
| `es-ES` | Navigation and action vocabulary agrees with [MUI X es-ES](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/esES.ts) and [rc-picker es-ES](https://github.com/react-component/picker/blob/master/src/locale/es_ES.ts). `Inicio`/`Fin` are suitable noun labels even though MUI uses verbs.                                                        | Apply the hour-cycle, `Meridiano`, and explicit-UTC candidates.                                                                                                                         | **Required** for Spain-specific tone, offset wording, and validation sentences.          |
| `fr-FR` | Navigation and endpoints match [MUI X fr-FR](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/frFR.ts). Upstreams vary among `Vider`, `Effacer la valeur`, and rc-picker's `Rétablir`, so the current `Effacer` should not be changed mechanically.                                                                                               | Apply the hour-cycle, `Méridien`, and explicit-UTC candidates.                                                                                                                          | **Required**, especially Clear versus Reset and repeated-time wording.                   |
| `de-DE` | Endpoints, actions, date/time field terms, and calendar controls align with [MUI X de-DE](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/deDE.ts).                                                                                                                                                                                              | Apply the hour-cycle and explicit-UTC candidates. Keep `Start` unless native review prefers MUI's `Beginn`.                                                                             | **Required** for compound nouns, offset terminology, and validation tone.                |
| `pt-BR` | Navigation, `Início`/`Fim`, and action labels align with [MUI X pt-BR](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/ptBR.ts). MUI uses `Hora de início`/`Hora de término`; the current shorter labels are understandable but should be reviewed in context.                                                                                   | Apply the hour-cycle, `Meridiano`, and explicit-UTC candidates.                                                                                                                         | **Required** for Brazilian usage, time endpoint labels, and DST messages.                |
| `ru-RU` | Navigation and actions align with [MUI X ru-RU](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/ruRU.ts); Ant Design independently confirms endpoint vocabulary.                                                                                                                                                                                 | Correct `диапазон даты` to `диапазон дат`; apply the hour-cycle and explicit-UTC candidates; replace vague `Период` only after native input.                                            | **Required** for every full validation sentence, AM/PM terminology, cases, and aspect.   |

## Release recommendation

The common picker vocabulary is consistent enough to retain. Implement the
small semantic corrections above, then require one fluent/native reviewer for
**each of the ten locales**, including English. The native pass must read every
string in its rendered context and with a screen reader or accessibility-tree
inspection, with special attention to:

1. Clear versus Reset behavior.
2. Year-grid pagination rather than literal previous/next-year navigation.
3. Standalone 12/24-hour option announcements.
4. The “earlier” and “later” occurrences of a repeated DST local time.
5. Minimum/maximum/step validation as date-time constraints, not generic
   numeric errors.

Open-source concordance cannot sign off the bespoke offset, nonexistent-time,
ambiguous-time, duration, and step-mismatch messages. Until native review is
recorded for a locale, its translation should be treated as a reviewed draft,
not release-ready localization.
