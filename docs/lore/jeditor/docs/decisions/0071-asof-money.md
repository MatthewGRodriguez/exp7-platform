# ADR 0071: As-of banner money details from the ported rd code

Status: accepted (2026-11-01), M15b; completes ADR 0068

- When `JM.rowCalcs.asofMoney` exists (rd_live pack), AsOfControl's banner uses the original `asofSet` + `asofBanner` on the level workbook, then restores it. The banner shows: cash ≈ at the date (month-end + one-offs dated ≤ date), the next month-end, surplus/mo, holes on this date, one-time items this month, and changed vs live.
- Levels without the money pack keep the generic banner.
- Verified: for As of 2026-12-15, the banner text equals the live UI's character for character (`editor/test/m15b_interaction_result.json`).
- **Not ported:** `asofDecorate`, the live UI's greying and disabling of inputs while the as-of date is set. The level refuses writes generically instead (ADR 0068).
