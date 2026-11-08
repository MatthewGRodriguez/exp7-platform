# ADR 0070: PLAN is a level tab made of section components; tabs go to seven

Status: accepted (2026-11-01), M15b

- **Sections become components.** The ten money-plan sections Matthew listed now live in their own components, in the live order: legacy (previously occurred), critical items, plan for the bad, buffer + burnout/rest, invest spare cash, realism, preferred plan, life plan, long range, dependencies & sequence. Three more components keep the live panel complete: PlanLegend (health legend), PlanActual (actual vs plan) and PlanCashCalendar (cash calendar).
  - Each component has `section` and `emptyText` props, wraps its output in `data-plan-section`, and shows an empty-state card when the level has no alternatives data.
  - All 13 are in the editor palette for any level.
- **Expenses.** The sections leave the EXPENSES tab, which keeps the rows, ▸ alternatives and totals.
- **Tabs.** ranking_data gets a PLAN tab right after EXPENSES. No tab is replaced, so there are **seven** tabs: INCOME, EXPENSES, PLAN, RANKS, CALENDAR, DEBT, ASSETS. This supersedes the six-tab constraint of ADR 0024/0067 for ranking_data.
- **Calendar views.** In ranking_data, CALENDAR's views go back to the live "Calendar | Board"; the M15 "Plan" view is removed there. Otherwise there would be two plans: the PLAN tab is the money plan over item alternatives, and a calendar Plan view would duplicate it confusingly.
  - The generic ItemPlan component stays for other levels. For example, task_calendar has its own PLAN tab with ItemPlan and no money.
- **Migration.** `tools/migrate_to_data.js planTab()` does all of this from v1, deterministically (jdata_test: migrate(v1) == ranking_data). stateVersion is 4, and 1–3 migrate.
