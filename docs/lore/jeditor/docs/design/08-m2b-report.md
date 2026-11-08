# 08 — M1 + M2b report: level builder + ranking_ui v1 (2026-10-30)

## Built
- `builder/build_level.js` — `node builder/build_level.js <level.json> <out.html>` → ONE self-contained HTML: embedded level JSON, motion runtime generated from `builder/motion/state_table.json` (`gen_jmotion.js`), JFactor Exp6 bundle + `engine/src/jf_engine.js` (separate script tags — bundle ends without `;`, see Issues), runtime + only the used components. CSP: `default-src 'none'; connect-src 'none'`.
- Motion: `builder/test/motion_parity.js` PASS — 19/19 state rules byte-identical to TDD SM1b `sm.css`; edges/easings/parallax/`go()` identical. Ambient drift on by default, switch `#jm-ambient` (adds `html.jm-amb-off`).
- Runtime `builder/runtime/jlevel.js`: component registry, metrics, persistence (`state.persist=local`, `storageKey=jeditor:ranking-ui-v1`, `stateVersion=1`; mismatched version discarded), money flash on change.
- Components (`builder/components/`): AppShell, Tabs, Hint, KPIGrid, Placeholder, TotalsTable, AddRowForm, EditableTable.
- Pack `builder/packs/ranking_money.js`: ports calcIncome / calcExpenses / debtMonthMath+calcDebt normalization / calcAssets from `ranking_ui.html` (read-only, md5 unchanged).
- Level `levels/ranking_ui_v1/` (`make_level.js` → `level.json` [REDACTED-AMOUNT] B → `ranking_ui_v1.html` [REDACTED-AMOUNT] B). `meta.containsPersonalData=true`. Tabs: INCOME, EXPENSES, RANKS (M3 placeholder), CALENDAR (M4 placeholder), DEBT, ASSETS. No summary strip, no Goals.

## Run
```
node builder/test/motion_parity.js
node levels/ranking_ui_v1/make_level.js
node builder/build_level.js levels/ranking_ui_v1/level.json levels/ranking_ui_v1/ranking_ui_v1.html
node tools/cdp_shoot.js levels/ranking_ui_v1/verify_spec.json   # headless Chrome, temp profile
```
Open `ranking_ui_v1.html` directly (file://). Contains personal data — do not share.

## Verified (headless Chrome, CDP, 1440×1000, 2026-10-30)
- 0 console errors, 0 exceptions. Network: 2 requests, both the file itself (load + reload test); 0 external.
- Engine: `JL_ENGINE = {backend: webgpu, n: 97, parityOk: true}` (scoreAsync vs scoreSyncJs).
- Edit: Monthly Base Pay [REDACTED-AMOUNT] → gross [REDACTED-AMOUNT] → [REDACTED-AMOUNT], totals cell re-rendered, 7 flash elements, localStorage written; after reload `from=local`, value [REDACTED-AMOUNT] persisted; Reset clears storage and restores [REDACTED-AMOUNT].
- Ambient switch: off → animation `none` + `html.jm-amb-off`; on → `smDy, smDx`.
- Screenshots: `levels/ranking_ui_v1/shots/level/lvl_{INCOME,EXPENSES,DEBT,ASSETS,RANKS}.png`, `edit.png`; originals `shots/original/orig_*.png` (original md5 3dca951d… unchanged).

## Not verified
Safari, headed Chrome, real WebGPU on other GPUs, worker path in this file (engine chose sync WebGPU), mobile widths, screenshots below the fold (viewport only).

## Differences vs original (sheet values match: gross [REDACTED-AMOUNT], net [REDACTED-AMOUNT], living [REDACTED-AMOUNT])
- KPIs are sheet-based, not calendar-run: Surplus [REDACTED-AMOUNT] (orig [REDACTED-AMOUNT]), Living KPI [REDACTED-AMOUNT] (orig calendar [REDACTED-AMOUNT]), net worth [REDACTED-AMOUNT] (orig [REDACTED-AMOUNT], uses live debt balance), rank items [REDACTED-AMOUNT] (orig [REDACTED-AMOUNT] from REVIEW pools). run() H/M dropped.
- DTI [REDACTED-AMOUNT] vs orig [REDACTED-AMOUNT]: card amount due [REDACTED-AMOUNT] vs [REDACTED-AMOUNT] — card has terms/payment 0, our port applies calcDebt's [REDACTED-AMOUNT]-term fallback; orig uses calendar/live logic (`debtLiveAtDate`) not ported.
- Debt Balance/Gap from stored values, not calendar walk.
- Score column shows "M3".
- Not ported: scenario toggle, as-of date, Reload/Budget disk, rdDepPanel, redundancy toggles, legacy debts panel, "how sheets calc" help, status log.
- Font: local monospace fallback (no network fetch for JetBrains Mono).
- Wide debt table scrolls horizontally inside the pane.

## Issues fixed during M2b
- ASI hazard: Exp6 bundle ends `JBlueprint.prototype.world = function(){…}` with no `;`; concatenating the engine IIFE invoked it → `JWorld.fromBlueprint: need a JBlueprint`, `JFEngine` undefined. Fixed by separate `<script>` tags (+ leading `;`). Bundle untouched.
- Money/debt cells wrapping; fixed with nowrap + horizontal scroll.

## Remaining
- M3: RANKS tab (calcRanks, Score 0–[REDACTED-AMOUNT], pools), live debt balance.
- M4: CALENDAR run, calendar-based KPIs (Surplus/Living/DTI parity with orig), run() H/M.
- Cross-browser checks; optional JetBrains Mono embed (license check first).
