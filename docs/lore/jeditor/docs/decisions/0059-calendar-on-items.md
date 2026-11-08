# ADR 0059 — Calendar acts as item collections, computation stays wrapped (M14)

Status: accepted (2026-10-31)

- `tools/migrate_to_data.js` (`onItems`, also run by `migrate` and the editor migrate button) declares three item collections over the existing stores, in place:
  - `cal_acts` → `workbook.calendars.current.customActions`
  - `cal_acts_projected` → `workbook.calendars.projected.customActions`
  - `cal_acts_review` → `workbook.calendars.review.customActions`
- Fields: name, kind, polarity, amountMonthly (money), cadence, section, enabled (bool). Alternatives map is `alternatives/choice/amount`.
- The items and joys panels list and edit them, and bindings can reference them.
- **What stays wrapped code, and why.** `calendar_model.js` and `calendar_live.js` (ADR 0030) still compute the bills/payday schedule, the cash ledger, rails, the day grid, day detail and plan paths.
  - They are embedded in all five levels. Rewriting them as node graphs would change every level's bytes and break the 36-check calendar parity against the workbook.
  - The data system owns the declarations (item types, conditions, joys) and the storage. The engine reads the same stores, so the two cannot diverge.
- Not done in M14:
  - Payday/recurrence pickers in an item detail.
  - Building a calendar from an empty level purely by items. CalendarBoard still needs `workbook.calendars` seeds.
