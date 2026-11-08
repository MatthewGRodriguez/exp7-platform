# 0050 — Migrating hard-wired levels onto the data system

Status: accepted (2026-10-31, M11)

`tools/migrate_to_data.js` exports `migrate(level, newId)` → `{level, collections, blueprints, outputs, rebound, oldKey, oldV, errors}` (pure: the input is not mutated; a level that already has `data` is refused). CLI: `node tools/migrate_to_data.js <in> <out> <newId>`. Editor: Data panel → "migrate bindings…" (`POST /api/data-migrate`, 409 if already migrated), one undoable step.

For ranking_ui levels it creates 10 collections (income entitlements/deductions, expense sections, debts, assets, and records for calendars, tombstones, hdame, ranks, cal) and 6 metric blueprints with 27 outputs (income.*, expenses.*, debt.*, assets.*, cal.*, ranks.items) reproducing the pack metrics, rebinds 14 component bindings, and sets a new storageKey with `migrateFrom` the old one.

Proof: migrate(ranking_ui_v1) == committed `levels/ranking_data` (CLI and editor button); rendered INCOME/EXPENSES/DEBT/ASSETS/RANKS/CALENDAR text, live values and KPIs equal to v1 (only the RANKS engine-timing text differs), screenshots 0 px different.

Not migrated (still read in place by library code): see docs/design/17-m11-report.md.
