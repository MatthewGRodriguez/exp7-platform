# ADR 0091: Calendar template = calendar + Board + Plan components and 3 editable blueprints, copied once

Status: accepted (2026-11-01), M18.

- `World.calendarTemplate(w, name, month)` (palette: Templates tab, "Calendar (Board + Plan)") writes ordinary world records: `comp:<slug>` (layout calendar, month, `switch:true`, `group:[board, plan]`, states busy/overload), `comp:<slug>_board` (layout board, `target` = calendar, sort/filter state), `comp:<slug>_plan` (layout plan, `source` = calendar, state conflict), and blueprints `<slug>_workload` (days count ≥2 → busy), `<slug>_depconflict` (days conflicts >0 → conflict on the plan), `<slug>_drop` (calendar drop event → item date = target day).
- It is a one-time copy: nothing records the template; every record is user-editable; a second copy gets fresh ids.
- The calendar shows a Board / Plan **switch** (`view.group`), not tabs. Board and Plan are standalone components referenced by ref (they can also be placed elsewhere); `refs()` counts view.group/target/source so deleting one shows broken refs.
- Items use fields date (YYYY-MM-DD), repeat (once/daily/weekly/monthly), days (duration). Membership in the calendar is a UI action (Board "→ Calendar" or a drop onto a day); the date is set by the drop blueprint.
