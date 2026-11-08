# ADR 0068 — Generic "As of" date

Status: accepted (2026-11-01), M15

- The original ranking_ui (easy222, `asofCtlHtml`/`asofBanner`) has "As of [date] [Live]" at the right of the tab strip. Picking a date swaps WB for a derived read-only clone. The banner reads "Showing plan as of DATE — read-only" and shows cash ≈, holes on this date, one-offs and changed-vs-live.
- **AsOfControl** (a generic component in the Tabs `strip` slot) sets `state.values.asOf`. Effects:
  - ItemCalendar and the money pack's `JCal.today()` (wrapped by jdata) use that date as today, which changes the focus month, the today mark and month-relative numbers.
  - A read-only banner is shown.
  - ItemBoard and ItemPlan writes are refused until "Live".
  - It uses a native date picker plus a Live button; there is no typing.
- **Not reproduced yet:** the original banner's money details (cash ≈ at date, holes, one-offs, changed-vs-live). They come from the redundancy cash plan (`rdCashPlan`/`asofWithLive`), which is not ported (see report 22).
