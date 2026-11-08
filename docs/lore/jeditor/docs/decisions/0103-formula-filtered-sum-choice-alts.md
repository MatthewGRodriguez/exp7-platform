# ADR 0103 — generic formula node, filtered sum, choice/date cells, row alternatives (M20d)

Status: accepted (2026-11-01)

## Decision
- `formula {comp, expr, out, deep}`: a safe expression (own tokenizer + recursive descent, no eval) over each item's fields
  (values then state), joys as `J.id`, functions `if/min/max/abs/round/ceil/floor/ln/num/has` and `gmax('field','groupField')`
  (max of a field among items sharing a group value). Writes `state[out]` per item; outputs `total`, `max`, `values`.
- `sum` gains `match`/`value` (only items whose field equals the value) and reads state as well as values.
- Dependency keys are field level for state (`state:<field>`), so two formulas over the same items do not form a false loop.
- Joy nodes that only SET a joy (value output unused) no longer count as reading it (fixes the false ⟳ loop marker); `add` still loops by design.
- Table cells: `edit:'choice'` (static `choices` or `choicesFrom` a component) and `edit:'date'` (month grid) open click pickers.
- Table `alts {comp, by, tag}`: rows get ▸; the entry whose `values[by]` points at the row shows its pick as a tag, Requires / Needed by,
  and expanded member rows with Unavail. (alts.unavail), Prefer (alts.pref), Try (state.userPick) and + alternative.
- `values.needs` (`item:x` or `item:x#KEY`) gates an item or alternative member on another item's current pick (live jreq).
- Header joys are formatted (`joy.fmt`, default 2 decimals).
- Editor keyboard gains an on-screen symbol row `+*<>=!?'&|` for expressions (still click-only input).
