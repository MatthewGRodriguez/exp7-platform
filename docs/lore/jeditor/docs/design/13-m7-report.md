# M7 report — a real component editor (2026-10-30)

## How to launch
`node editor/serve_editor.js`, then open http://127.0.0.1:8791/. The server binds 127.0.0.1 only. Model mode is at `/model#<id>`. Stop it with Ctrl-C.

## What exists
`editor/editor.{html,js,css}` (60 KB JS), `editor/presets.json`, `editor/serve_editor.js` (with `/api/preview`, `/api/component-source` and the harvested preset library), `builder/runtime/jvariants.js`, and the new components ButtonRow and MoneyValue.

- **Toolbar:** New, Open, Save, Save As, Export (with embed check), Undo/Redo and a dirty indicator.
- **Preview:** live and same-origin (`/preview/<tok>`), with click-to-select and inline render errors. Tabs stay clickable.
- **Palette and tree:**
  - add, remove, duplicate, ↑↓ and drag reorder/nest;
  - slot rules (for example, `side` rejects EditableTable);
  - tabs, with tab names entered on the on-screen keyboard.
- **Inspector:** props, data (embedded workbook sources only), source (read-only), variants (ADR 0036), motion and level settings.
- **Pickers:** every value comes from presets, the on-screen keyboard or harvested presets. There are no typed fields.

## Verified (headless Chrome, temp profile)
- **INCOME by clicks** (`verify_m7_editor_spec.json`, 32 steps): all clicks OK.
  - Passed: undo/redo, drag + undo, slot rule, variant compile + preview, inline variant error, save (rev 1) and reopen round-trip (identical).
  - Export embed check OK. 0 console errors, 0 exceptions, 0 external requests.
  - Component props are identical to the original's INCOME + side (6/6).
  - Rendered compare (`compare_m7.js`): hints, both tables (18 and 20 rows), forms, 6 KPIs and the header (timing normalised) are identical. The full-body text differs only because that level has just one tab.
- **Six-tab rebuild** (`verify_m7_sixtab_spec.json`, 15 steps, 292 clicks): all OK. Exported `levels/ranking_rebuild/ranking_rebuild.html` (823,488 B), embed check OK.
  - Structural compare (`compare_m7_sixtab.js`): 21/21 components identical (type, props and slots, key order ignored) across INCOME 5, EXPENSES 3, RANKS 1, CALENDAR 1, DEBT 4, ASSETS 6 and side 1.
  - Also identical: tabs props, shell, theme, jfactor, logic, workbook/ranks/cal state values and motion.
  - Rendered compare for all six tabs (switched via `JL`): hints, tables, forms, KPIs, header and **full body text are identical on every tab**. 0 errors and 0 external requests on all three pages.
- **Regressions:** ranking_ui_v1 rebuilds byte-identical (823,224 B, sha1 223ba8e…). rank, motion, calendar, plan and sync parity all PASS with max diff 0. The M6 editor spec passes.

## Differences / honest caveats
- **Presets are harvested.** Column/total/tile/row/group presets are taken from existing levels, including the original's own objects. "By clicks" means picking those presets, not authoring them field by field.
- **Ids and keys differ.** Component ids are editor-generated. storageKey is `jeditor:ranking-rebuild`, stateVersion is 1 with no migrations, and the level has an empty `customComponents`.
- **Coded internals.** Debt `cells` totals rows can be picked as presets but not edited. RankBoard and CalendarBoard internals stay coded and are configured, not composed.
- **Motion.** Motion edges are level-wide; there are no per-component animation edges.
- **M6 spec side effect.** The M6 spec saves a Model-mode overlay (`levels/ranking_ui_v1/editor.json`), which changes the ranking_ui_v1 build. The overlay was removed after the run and byte-identity re-verified.

## What remains
- Field-level authoring of columns and totals (currently presets).
- Composable rank and calendar internals.
- Per-component motion.
- Persisted history.
- An editor-side visual diff view.
