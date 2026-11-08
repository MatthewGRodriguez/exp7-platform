# 0039 — Field-by-field columns, totals and KPI values (JFields)

Status: accepted (M8, 2026-10-31)

## Decision
- **Opt-in per component.** EditableTable, TotalsTable and KPIGrid get `props.fb = 1`. Legacy (preset) props are untouched; presets remain shortcuts.
- **Runtime.** `builder/runtime/jfields.js` is inlined by `build_level.js` **only when some component has `props.fb`**, so legacy levels (ranking_ui_v1) build byte-identical.
  It wraps `JC.types` renders: fb EditableTable uses its own column renderer; fb TotalsTable/KPIGrid turn each value spec into a synthetic metric `fx:<id>:<i>` and reuse the base renderer.
- **Value spec** (JSON, built by pickers): `{metric}` · `{num}` · `{field}` (row level) · `{agg:{fn,path,key,rowCalc?,filter?:{key,op,v}}}` · `{expr:[v,{op},v,…]}`.
  - fn ∈ sum/count/avg/min/max; filter ops = ≠ > < ≥ ≤ empty set.
  - Expression ops + − × ÷ are evaluated **strictly left to right** (no precedence; e.g. `a − b × 12` = `(a − b) × 12`, which is what ANNUAL NET needs). Constants are set with ±1/±10 steppers.
  - Field keys: real row keys from the bound data, `@amount` (current → projected → review), `calc.<path>` from a row calculator (`debt`).
- **Columns:** kind text/money/percent/number/date/select/score/computed/del, key picked from actual source keys, options amt, small, w (±10 stepper), pol, bold, title, edit:false, align, flash:false; drag reorder with pointer events.
- **Totals rows:** `{label, v, pol, fmt, note}` or aligned `{cells:[{label,span}|{v,pol}|{}]}`.
- **Text** (labels, headings) comes from the string picker or the on-screen click keyboard; no physical typing is required anywhere.

## Consequences
- A level built field-by-field carries the 14 KB JFields runtime; a legacy level does not.
- Left-to-right expressions are simple to build by clicks but cannot express precedence/parentheses; build nested values in order instead.
