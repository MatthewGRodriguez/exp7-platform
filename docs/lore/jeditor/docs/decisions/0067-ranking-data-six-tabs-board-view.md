# ADR 0067 — ranking_data keeps six tabs; Board is a view of CALENDAR; money is a configuration

Status: accepted (2026-11-01), M15

- **Choice: keep the six v1 tabs.** The CALENDAR tab's view bar is now `Calendar | Plan | Board` (CalendarBoard `views`). Board shows the generic ItemBoard over `@cal_acts` (`when: cal.view=board`). Reason: it keeps v1 parity on the other five tabs and matches the real UI's tab set. A separate Board tab can still be added later by moving one component.
- **The money calendar view is still rendered by the money pack** (CalendarBoard + calendar_live). Its day ledger is published as library day measures (`money.cash`, `money.income`, `money.spend`, `money.chips`), so an ItemCalendar configured with those measures shows the same numbers. This was verified in the browser: 92 days over 3 months, 0 mismatches against `JCal.month`. ranking_data does not yet replace the money calendar with ItemCalendar, because rails, paydays, opening cash, range pick and the plan ledger are pack features that the generic grid lacks. Doing so would regress fidelity to the real UI.
- Tabs gained a `strip` slot (it accepts AsOfControl). This changes the Tabs and CalendarBoard source bytes in every level. Equivalence: ranking_ui_v1 rebuilt vs committed is 0 px on all six tabs.
