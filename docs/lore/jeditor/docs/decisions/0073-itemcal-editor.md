# ADR 0073: Editor panel for item-calendar measures and plan score; day.* in the condition builder

Status: accepted (2026-11-01), M15b

- The new editor panel "itemcal" (`editor/itemcal.js`) can do the following:
  - add a task calendar from empty: an item collection plus ItemCalendar, ItemPlan and ItemBoard, and a PLAN tab;
  - add, date, repeat, size and delete items, and give them date alternatives;
  - edit the day **measures**: count, or sum/max of a numeric field; label, unit, format; which measure the days show;
  - edit the **plan score**: aggregate (max/sum/avg/min/last) of a day measure, and whether lower or higher is better.
- All input is pickers and clicks, and every change is one undoable edit.
- The condition builder's measure list (`editor/data.js mets()`) lists every ItemCalendar's `day.<measure>` first.
- Click proof (`editor/test/make_m15b_spec.js`, result `m15b_proof_result.json`):
  - from an empty level, by clicks only: 4 tasks, one alternative, a sum(hours) measure, the plan score max(day hours) with lower better, and the condition `day.hours > 6` (picked from the day.* list);
  - result: one bad day (Nov 4, 8 h), and the plan ranks "Report → Later" first (0 bad, 6 h);
  - the palette lists the 13 Plan* components.
