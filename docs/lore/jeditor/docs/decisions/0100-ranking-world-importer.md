# ADR 0100 — Ranking world importer (M20a)

Status: accepted (M20a)

The live ranking UI's data (`vendor/workbook_local.json`, `actuals_local.json`, `budget_map.json`, snapshotted read-only into
`levels/ranking_world/source/`) is imported by `tools/import_ranking_world.js` into a v5 world (`levels/ranking_world/world.json`).

- Every row becomes an item: [REDACTED-AMOUNT] entitlements, [REDACTED-AMOUNT] deductions, [REDACTED-AMOUNT] expense lines (one component per section, [REDACTED-AMOUNT]), 104 alternative entries whose
  432 alternatives are member items (`alts.members`, `alts.pref`, `alts.unavail`), 2 debts + 1 legacy debt, [REDACTED-AMOUNT] assets, [REDACTED-AMOUNT] calendar actions, 33 rules.
- `req` becomes `jreq` (first) plus `values.requires` (all). Alternative rubric value becomes factor `alt_value`.
- Factor order becomes joys with harmonic weights ((1/k)/H_n); rank orders, goals, as-of, opening cash are joys.
- Actuals, budget map and workbook meta are kept verbatim as data items; nothing is invented.
- Only `current` values import: live scenarios PROJECTED / PROJ+REVIEW are replaced by alternatives (doc 30 decision).
- Ids are slugged and capped at 36 chars + uniqueness suffix to satisfy the v5 id rule.
- Derived numbers (dated debt walk, totals) are not stored: blueprints compute them (M20c+).
