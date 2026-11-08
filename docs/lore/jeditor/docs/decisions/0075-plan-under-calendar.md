# ADR 0075: The Plan sits under the calendar (CalendarPlan and the `plan` slot)

Status: accepted (2026-11-01), M16. Supersedes the PLAN-tab placement in 0070.

- The Plan is now part of the calendar it plans, rather than a separate tab:
  - `ItemCalendar` and `CalendarBoard` each gain a slot `plan`. It accepts the optional sections: PlanLegend, PlanActual, PlanLegacy, PlanCritical, PlanBad, PlanBuffer, PlanInvest, PlanRealism, PlanPreferred, PlanCashCalendar, PlanLife, PlanLongRange and ItemPlan.
  - Below its calendar, each one renders `<section data-cal-plan>`: first the slot sections in order, then the built-in Dependencies & sequence block. That block comes from the new internal component `CalendarPlan`, which is not in the palette and is inlined by the builder only when it is needed.
- `ItemCalendar` always shows the plan.
- `CalendarBoard` has `planSection` (default **false**) and `planItems` (default `@cal_acts`). Because the default is off, ranking_ui_v1 and the rebuild levels build the same as before:
  - income/m8 rebuild HTML is byte-identical;
  - ranking_ui_v1 and ranking_rebuild render identical text on all six tabs (old vs new build).
- `PlanDependencies` is marked deprecated and is hidden from the palette, because its job is now built in.
- `ItemPlan` (path ranking) remains a plan section and lives in the calendar's plan slot.
- Editor (itemcal panel, "Plan under the calendar"):
  - choose a calendar, and toggle planSection on a CalendarBoard;
  - click a section on or off; it is inserted in canonical order;
  - move sections up or down;
  - the built-in deps row is always present;
  - each item has an "after" picker.
- All of these actions are clicks or pickers, and each is one undoable edit.
