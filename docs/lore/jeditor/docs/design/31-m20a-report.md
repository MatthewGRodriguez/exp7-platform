# M20a report — importer

- `tools/import_ranking_world.js` → `levels/ranking_world/world.json` (1,012,128 B; validate 0, broken refs 0).
- Counts: items inc [REDACTED-AMOUNT] · ded [REDACTED-AMOUNT] · exp [REDACTED-AMOUNT] · alternative entries [REDACTED-AMOUNT] (432 alts) · debts 2 · legacy 1 · assets [REDACTED-AMOUNT] · calendar actions [REDACTED-AMOUNT] · rules [REDACTED-AMOUNT] · data 4; joys [REDACTED-AMOUNT].
- Parity of raw sums vs live: gross [REDACTED-AMOUNT] ✔ · deductions [REDACTED-AMOUNT] ✔ · calendar spend [REDACTED-AMOUNT] ✔ · assets [REDACTED-AMOUNT] ✔ · factor weights M [REDACTED-AMOUNT] / E [REDACTED-AMOUNT] ✔.
- Difference: stored debt balances sum [REDACTED-AMOUNT]; live shows [REDACTED-AMOUNT] after its dated walk (pay-day interest/principal) — computed in M20g.
- Test: `world/test/ranking_import_test.js` 19/19; world_test 77/77.
- Remains: M20b–i, verification pass.
