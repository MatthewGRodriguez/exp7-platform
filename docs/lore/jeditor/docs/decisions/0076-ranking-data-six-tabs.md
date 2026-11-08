# ADR 0076: ranking_data returns to six tabs; the plan lives under CALENDAR

Status: accepted (2026-11-01), M16. Supersedes the 7-tab layout of 0070.

- `tools/migrate_to_data.js calPlan()` runs after planTab and is idempotent. It:
  - removes the PLAN tab, leaving INCOME, EXPENSES, RANKS, CALENDAR, DEBT, ASSETS;
  - moves plan_hint and the 12 sections, in live order, into `cal_board.slots.plan`;
  - deletes `plan_deps`, because deps are built in;
  - sets `planSection: true`;
  - maps a saved active tab of PLAN to CALENDAR;
  - sets stateVersion to 5.
- The 13 plan blocks in the CALENDAR tab are, in order: legend, actual, legacy, critical, bad, buffer, invest, realism, preferred, cashcal, life, longrange, deps. This is the live EXPENSES order.
- task_calendar (`tools/m16_calplan.js`):
  - has a single CALENDAR tab, with ItemPlan inside the calendar's plan slot;
  - gains an `after` field, and Taxes is set to come after "Review PRs";
  - gains a condition `deps: day.depConflicts > 0` (bad, shake);
  - stateVersion is 2.
