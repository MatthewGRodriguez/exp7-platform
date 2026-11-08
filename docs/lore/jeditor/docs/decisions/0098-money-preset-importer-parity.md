# ADR 0098: Money preset, ranking-workbook importer, numeric parity

Status: accepted (2026-11-01), M19.

- `moneyPreset(world, cal)` writes plain records: joys opening/warning(1000)/margin(0.1)/asof, states bad/low/tight/busy, blueprint `<cal>_cash` (accumulate → 3 conditions + days → merge → view style + label), sections Critical / Previously occurred / Upcoming under the Plan, view controls. Template `money` = calendar template + preset. No money code in the evaluator or runtime.
- `tools/import_ranking_calendar.js` translates data/ranking_ui/workbook_local.json into world items (the legacy model is used only to read inputs).
- `world/test/money_parity.js`: 8 months (Nov 2026–Jun 2027), cash, headroom and net per day vs `builder/packs/calendar_live.js`: 726 checks, max diff 0; day chips 3 months, 0 mismatches. Legacy month opening resets each month; the parity test evaluates each month from that same opening, as the legacy model does.
