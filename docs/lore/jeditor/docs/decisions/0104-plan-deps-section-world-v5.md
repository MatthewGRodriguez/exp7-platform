# ADR 0104 — every calendar Plan shows "Dependencies & sequence" (world v5, M22)

Status: accepted (2026-11-02)

## Context
ADR 0074 (M16, builder) agreed that every calendar's Plan has a generic dependencies/sequence section. The world v5 runtime and
templates (M17+) never ported it, and the ranking_world importer never brought over the live rd "Dependencies & sequence (jreq)"
panel. The M21 parity exclusion rule 3 (EXPENSES "⛑ Critical items" → "LIVE ROLL-UP") also covered the live section, so parity never
reported it missing.

## Decision
- Runtime: new generic layout `deps` (any component) and a built-in section appended to every `plan` (unless the plan already has a
  `deps` sub or `view.deps === false`). Rows = the plan's items; the sequence is the full jreq chain (`E.sequence`), default order is
  topological (prerequisites first, then date, then list order), `view.order:'given'` keeps the list order.
  Flags: ⚠ broken jreq, ⚠ conflict (required item not dated earlier, `E.itemFlags`), ⚠ order (prerequisite listed after), ⟳ cycle;
  summary "N steps · N flags". Optional `view.title/note/extra/btn`; per-item `values.seq/step/when/reqText/neededBy` override text.
  `view.hideName` hides a component's own heading (generic).
- ranking_world: `tools/rd_deps.js` runs the verbatim live `rdDepPanel` (builder/packs/vendor/rd_extract.js) at import, clock pinned
  (RD_PIN, default 2026-11-01). Each live row is the imported alternatives entry (`rd_*`, jreq = the real imported req), with live cell
  text as values; non-entry rows (income step, ◇ life dates, $ cash rules) are `dep` items. Plus the "Cash after" note and Month view
  table, all as subs of `calendar_plan`.
- Parity: rule 3 now stops at "^Dependencies & sequence"; a new rule moves that slice to `plan_deps`, which `tools/parity_report.js`
  compares with CALENDAR → Plan (number tokens, word tokens, step order, our flag count).

## Consequences
Templates → Calendar / Money calendar show the section by default (editor click test M22 + exported offline file). Our section flags
3 same-day conflicts the live UI does not flag (live allows same-day; the agreed rule says "not dated earlier").
