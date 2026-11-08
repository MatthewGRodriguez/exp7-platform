# 0047 — Data system: collections, typed fields, blueprint-only bindings

> Revised by ADR 0051/0053 (M12): collection kind `items`, data version 2 with `joys`.

Status: accepted (2026-10-31, M11)

## Decision
A level may carry `level.data = {version:1, collections, blueprints, migrateFrom?}`. Components read data only through it:
- **Collections** `{id, label, kind: list|groups|keyed|record, store, fields[], labelField, groupLabel?, created?, seed?}`. `store` is a path in `state.values`; collections created in the editor use `data.<id>` and carry `created:true` (+ `seed:{file,path,n}` when imported).
- **Field types** `text|money|number|int|bool|date|ref` (`ref` names another collection). Numeric fields may list a `fallback` of other fields; the first valid number wins (the workbook "amt" rule: current → projected → review).
- **Bindings**: component props listed in `JData.BIND` take `'@collection'` or `'@collection.sub'`, resolved by the runtime to the store path (`dataRefs` kept on the resolved component). Metric props (KPI tiles, totals) must name a **blueprint output**; `JData.validate` rejects anything else, and the builder throws on validation errors.
- **Editor**: with `doc.data` present, every binding picker (collections, tiles, totals, any-metric, record state) lists only blueprint-defined sources. Legacy levels without `data` keep the old pickers unchanged.
- **New components**: `DataTable` (collection table; columns = fields, computed fields, `score:<scorer>`; totals = outputs; inline edit) and `RankList` (rows ranked by a scorer).

## Consequences
Grouped collections sum per group then total (same float order as the original level). Levels without `data` build byte-identically to M10.
