# 0030 — Calendar logic embedded verbatim, not re-implemented on JFactor

Status: accepted (M4, 2026-10-30).

## Decision
- `vendor/calendar_model.js` is copied unchanged (md5 87a91c52b3dee6431f588972810dfc24) into `builder/packs/vendor/calendar_model.js`.
- `tools/extract_calendar.sh` brace-matches 70 functions out of `ranking_ui.html` (md5 3dca951d…) **verbatim** into `builder/packs/vendor/easy_calendar_extract.js`, a factory `JCalExtract(WB, …)`.
  - The extracted functions cover `easyOccurs`/`easyScheduleActions`/`easySpanPosOnDay`/charges, pay periods and bill rails, `debtLiveAtDate`, `ensureDebtPayLinks`, `calcDebt`/`calcAssets`, `easyMonthMoneyRoll` and `boardRankCandidates`.
  - Each function carries its original line number. Rendering and save functions are stubbed.
- The factory runs on a **clone** of the level workbook. `ensureCalendar()` is called first so that `WB.calendar` aliases `calendars[scenario]`, as the original does at boot.
- Re-implementing this logic on JFactor would not be faithful without a large re-derivation. Only the condition, metric and items layer is new (ADR 0029).

## Consequences
- Parity is exact (max diff 0; `builder/test/calendar_parity.js`), but the numbers depend on the date: `debtLiveAtDate` walks paydays up to today in Chicago time.
- The legacy `workbook.calendar` copy is no longer embedded in the level (−60 KB). `calendars.{current,projected,review}` and the 10 tombstones are embedded.
