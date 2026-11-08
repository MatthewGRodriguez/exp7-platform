# ADR 0065 — Generic item calendar, plan and board

Status: accepted (2026-11-01), M15

- **ItemCalendar** (`builder/components/ItemCalendar.js`): a day grid over any `items` collection. Items are placed by their own fields: `dateField` (ISO date), `repeatField` (once | daily | weekly | monthly | weekdays) and `durField` (days). Day **measures** are configured in props: `count`, `sum`/`max` of a field, or `lib` (a library measure registered by a pack). Labels, units, prefixes and formats come from props, so currency is just one `fmt`.
- **Conditions** are the ADR 0058 condition blueprints whose `cond.measure` metric is `day.<measure id>`. jdata validation now accepts `day.*` ids. Severity, style and animation work as in ADR 0058.
- **ItemPlan**: enumerates every combination of the items' `_alts` (exhaustive up to 512 paths, then greedy item by item). Each path is laid on the calendar month and ranked by bad days, then warning days, then a configurable score (`plan.measure`/`agg` = max|min|sum|avg|last, `dir` = min|max). The current path is marked. Pick writes `_alt` and reset clears it.
- **ItemBoard**: create, list, sort, filter (all/placed/unplaced/alts) and delete items. Values are edited inline with steppers, cycles and toggles. Alternatives: `+ alt` adds one and the current alt can be cycled. Items are placed or removed by date. A ⠿ chip can be pointer-dragged onto any `[data-ic-day]`. It is separate from the RankBoard parts and the editor panels.
- The engine is `JItems` in `builder/runtime/jdata.js`: pure functions, also exposed as `JD.JItems`. Tests are in `builder/test/items_test.js`; the demo level is `levels/task_calendar`.
