# ADR 0101 — Generic table / KPI / text views, number pad, sum node, tabs as a component (M20b)

Status: accepted (M20b)

- New node `sum {comp, field, deep}` → `total`, `count`: total of one numeric field over a component's items (deep = include subs). Generic; no money logic.
- New layouts, all view data (no hard-coded app code):
  - `table`: `columns [{label, field, fmt, edit}]`, `totals [{label, joy, fmt}]`, `add` (button label, `addName`, `addValues`), `remove` (× per row).
    Editable cells open a click-only number pad (digits, −, ., ⌫, OK, Cancel) that writes `values[field]` and triggers the normal pass.
  - `kpi`: `kpis [{label, joy, fmt, sub}]`.
  - `text`: lines with `{joy:id|fmt}` tokens.
- Formats: text, num, int, money, smoney (+$/−$), nmoney (always −$), pct, pct3.
- Theme lives in the view: tokens bg/fg/accent plus `edit` (editable-cell tint) and `font`.
- Tabs are an ordinary component: any component's `view.switch` + `view.group` (subs listed in group become tabs; others always show).
- World option `topJoys` limits which joys the top bar shows (default all).
- Editor: layout picker gains table/kpi/text; panels for columns/totals/add/remove, KPI cards, text + joy tokens + new line (on-screen keyboard),
  and "Tabs (switch)" for any component with subs. All by click/picker.
