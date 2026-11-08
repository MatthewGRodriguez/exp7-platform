# ADR 0092: `days` node and per-day (map) conditions drive day highlight states

Status: accepted (2026-11-01), M18.

- New blueprint node `days` {comp, measure count|sum|conflicts, field} → `values` (map day→number) and `total`. It reads members of the comp and items*.
- A condition whose input is a map is evaluated per key: state becomes a map, ok a count. A map wired to view.style writes `state.dayStyles`, which the calendar renders as `data-style` on `.jw-day`.
- Item writes reach every blueprint that reads items* (deps), so date/jreq edits re-run workload and conflict.
- Plan flags: `itemFlags` → broken (jreq target missing) or conflict (jreq target date ≥ own date). Plan order = jreq sequence; alternatives still pick via Exp6.
