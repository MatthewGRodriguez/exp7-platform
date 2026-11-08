# M8 report — columns, totals and KPIs field by field

## What was built
- `builder/runtime/jfields.js` (14,044 B) — runtime for fb components (ADR 0039); `builder/build_level.js` inlines it only when `props.fb` exists.
- `editor/fields.js` ([REDACTED-AMOUNT] B) — inspector UI: columns add/remove/drag/↑↓, kind, binding picker over real keys, display flags, width stepper; totals rows and aligned cells rows (span ±); value builder (row field / aggregate + filter / metric (fields + jfactor.metrics) / number stepper / expression); KPI tiles; AddRowForm "→ to" target picker. Mode row: "start empty · field-by-field" or "convert to field-by-field".
- `editor/editor.js` (61,603 B), `editor.html`, `editor.css`, `serve_editor.js` (`/fields.js` route), `presets.json` (adds level id `m8_rebuild`).
- Tests: `editor/test/m8_targets.js` (target specs + oracle), `editor/test/make_m8_spec.js` (click script), `editor/test/m8_compare.js` (render extract + diff).
- Proof level: `levels/m8_rebuild/level.json` (334,053 B), `levels/m8_rebuild/m8_rebuild.html` (799,099 B, embed check ok: 0 external refs, CSP default-src 'none').

## Proof (verified 2026-10-31, headless Chrome, temp profile)
- Run: `node editor/serve_editor.js 8793`, `rm -rf levels/m8_rebuild`, `node editor/test/make_m8_spec.js 8793`, `node tools/cdp_shoot.js levels/ranking_ui_v1/verify_m8_editor_spec.json`.
- **82 steps, 1,670 clicks, 0 misses, 0 console errors/exceptions, 0 external requests.** New level → 4 tabs → INCOME (2 tables), EXPENSES (1 table, LIVING/DEBT PAYS filtered sums), DEBT (17 columns incl. debt row-calculator fields, select, score, computed payoff/source/cash pay; aligned TOTALS cells row; DEBT-TO-INCOME TotalsTable with DTI expression), ASSETS (3 tables + totals incl. net worth), side KPIGrid (6 tiles) → Save → Export. No presets used; text via on-screen keyboard clicks.
- Rendered compare (`m8_compare.js diff m8_cmp_rebuild`) vs ranking_ui_v1 on INCOME, EXPENSES, DEBT, ASSETS: **tables (incl. selected option text), totals and KPI tiles identical on all four tabs** (rows [REDACTED-AMOUNT] [REDACTED-AMOUNT] / [REDACTED-AMOUNT] / 4,4 / [REDACTED-AMOUNT]; KPIs 6/6).
- Expected differences: hints, AddRowForms and full body text differ because the rebuild contains only the tables/totals/KPIs (no hint lines, add-row forms, header title/sub, RANKS/CALENDAR tabs). Screenshots therefore are not pixel-identical; the table regions match visually (checked DEBT side by side).

## Coverage — honest
Exercised by the click test: kinds text, money, number, select, score, computed (row-calc field, payoff, source, cash pay), del; fmt money/int/pct; aggregate fn **sum only**; filter ops empty/set; expression ops − × ÷; number stepper; cells row with span; KPI metric + expression tiles.
Built but **not exercised by an automated test**: kinds percent and date; fn count/avg/min/max; filter ops = ≠ > < ≥ ≤ with distinct-value picker; op +; flags flash/align/edit:false; column drag reorder (pointer events) and ↑↓; AddRowForm "→ to"; "convert to field-by-field". These are unverified.
Not covered: hint lines, forms and header were not part of the rebuild; expressions have no precedence/parentheses (left to right only).
Typing: none required; labels are composed with the on-screen keyboard (many clicks — e.g. the whole run is 1,670 clicks). That is the one place where a keyboard would be far faster.

## Regressions (2026-10-31)
- ranking_ui_v1 rebuild byte-identical: 823,224 B, sha1 223ba8e07203cfa75acbe98613bc153b75728cc4.
- rank parity PASS max diff 0; motion parity PASS; plan tests PASS (maxDiff 0); sync parity PASS max position diff 0.
- calendar parity is date-dependent: on 10-31 it FAILs (debt live balance [REDACTED-AMOUNT] off) because the capture is from 10-30; with Date pinned to the capture day (test-only preload, no code change) PASS, 36 checks, max diff 0.
- income_rebuild and ranking_rebuild rebuild byte-identical (781,215 / 823,488 B); M7 rendered compares same except known: income_rebuild body (single tab) and RANKS body differing only in the "N ms" scoring time.
- M6 editor spec passes (no misses/errors) but it saves into ranking_ui_v1 (level.json, html, editor.json). It was run on a temporarily repointed port against the real level with a backup; afterwards editor.json was removed, level.json restored and the html rebuilt — sha1 223ba8e0… verified. It was not run on a separate copy.
- No editor.json left in any level.

## What remains
- Automated tests for the unexercised options above; hints/forms/header in a full rebuild; precedence in expressions if wanted; a faster text-entry path.
