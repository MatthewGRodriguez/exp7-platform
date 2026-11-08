# 0052 — Joys are universal shared named values

Status: accepted (2026-10-31, M12). Revisits 0018/0019 (Joy only existed inside JFactor calls / board packs).

`level.data.joys[]` (data v2): `{id, label, unit, kind: amount|weight|rate|count|time, value, jmax, min, max, polarity: produce|consume, pack?:'name@x.y.z', derive?:{lib, dim}}`.

- A joy is shared by every blueprint and item that names it; it maps to a JFactor `Joy` (value, jmax) when scored on Exp6 (0053).
- **Reference vs override**: blueprints *reference* a joy by id (`joy.value`, `joy.jmax` nodes). The value resolves as
  item `_joy[id]` (per-item override) → `derive` library (read-only, e.g. `rank.factorWeight`) → page state `state.values.joys[id]` (editable in the exported page via JoyTable, persisted per 0049) → the registry `value`. `jmax`: item `_jmax` → registry `jmax` (default 1).
- Level-wide by default; `pack` marks a joy as shared under a pack name (recorded only; no cross-level pack loader yet).
- References: `JData.joyRefs(data, values)` → `{blueprints, items, overrides}`; the editor joys panel shows the count and list. **Delete protection**: deleting a referenced joy opens a warning (keep / delete-and-unwire; the latter removes its joy nodes and overrides in one undoable step).
- Validation: id `^[A-Za-z][A-Za-z0-9_]{0,40}$`, known kind/polarity/derive lib, numeric value/jmax/min/max; a graph naming an unknown joy is an error.
