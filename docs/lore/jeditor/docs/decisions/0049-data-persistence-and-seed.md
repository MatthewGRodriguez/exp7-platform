# 0049 — Data persistence, seed import, storage migration

Status: accepted (2026-10-31, M11)

- Collection rows live in `state.values` (store path), so the existing state persistence (`persist:'local'`, `storageKey`, `stateVersion`, Save button) persists them; nothing new is stored elsewhere. Editor snapshots/undo include `doc.data` and `state.values.data`.
- **Seed import** (editor): `GET /api/data-files` lists arrays of row objects in the dataset's local JSON files (`data/ranking_ui`: actuals_local, workbook_data, workbook_local); `GET /api/data-file?f=&path=` returns one. Import goes into an existing created collection (keeping its fields) or a new one with inferred types. Seeds are copied into the level; no fetch at runtime.
- **Storage migration**: `data.migrateFrom = {storageKey, stateVersions[]}`. On first load, if the new key is empty and the old key holds a listed stateVersion, the values are copied under the new key (`migratedFrom` recorded). The old key is never deleted.
