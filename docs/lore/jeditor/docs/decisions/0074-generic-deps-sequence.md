# ADR 0074: Every calendar has a built-in "Dependencies & sequence" plan

Status: accepted (2026-11-01), M16

- Dependencies and ordering are generic, so every calendar gets them. Items name what they come after in an `after` field (prop `afterField`, default `after`; the value is "A, B" or a list).
- `JItems.deps(rows, C)` in `builder/runtime/jdata.js`:
  - builds nodes that carry start, end, after and seq;
  - orders them topologically, breaking ties by start date and then list order;
  - reports three kinds of issue: **missing** (the named dependency does not exist), **cycle**, and **order** (the item starts on or before its dependency's end);
  - returns `{nodes, seq, edges, issues, conflict}`.
- Every month gets a built-in day measure, `day.depConflicts` (the number of items that day with a dependency issue). Conditions use it like any other `day.*` measure, for example `day.depConflicts > 0 → bad`. The plan's path ranking therefore counts dependency conflicts as bad days.
- The money calendar (ranking_data) keeps Exp6's jreq table (the rd_live `deps` panel), which is the live UI's "Dependencies & sequence". When a calendar also has rows with `after`, the generic card is shown below that table.
