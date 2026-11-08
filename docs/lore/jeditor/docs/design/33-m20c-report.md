# M20c report — INCOME

Parity vs live INCOME (max diff [REDACTED-AMOUNT]):

| total | live | importer level | click-built in editor |
|---|---|---|---|
| Gross monthly income | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] |
| Deductions | −[REDACTED-AMOUNT] | −[REDACTED-AMOUNT] | −[REDACTED-AMOUNT] |
| Net monthly income | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] |
| Annual gross | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] |
| Annual net | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] | +[REDACTED-AMOUNT] |

- Rows: [REDACTED-AMOUNT] entitlements + [REDACTED-AMOUNT] deductions (live [REDACTED-AMOUNT] + [REDACTED-AMOUNT]).
- Click proof (`editor/test/make_m20c_spec.js`, 49 steps): from an empty world, 31 items with live names/amounts typed on the on-screen keyboard,
  5 joys, blueprint (2 sum, 4 math, 5 joy, 11 wires by port clicks), 2 tables (columns/formats/editable/totals/Add/× by pickers), text note,
  INCOME tab component, Tabs component with switch on root; preview + export ([REDACTED-AMOUNT] B, self-contained, network closed). 0 exceptions.
- Offline exported page: number pad [REDACTED-INSTITUTION] → [REDACTED-AMOUNT] gives gross +[REDACTED-AMOUNT] / net +[REDACTED-AMOUNT]; Add row + × remove recompute; requests file + blob only.
- Importer level: `levels/ranking_world/ranking_world.html` [REDACTED-AMOUNT] B (whole workbook embedded), world.json ≈[REDACTED-AMOUNT] MB; offline totals identical; no network.
- Differences vs live: no inline name text inputs; no scenario toggles (dropped by decision); sidebar/flow line/status come in M20i.
- Screenshots: /workspace/jeditor_shots/m20/.
