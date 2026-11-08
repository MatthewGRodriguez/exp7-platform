# 0051 — Items are the first-class data holder (item types)

Status: accepted (2026-10-31, M12). Revises 0047 (adds collection kind `items`, data v2) and 0019; supersedes the "rows only" reading of 0008/0013 for scored things.

An **item** is a row of an **item type** — a collection with `kind: 'items'` (`level.data.collections[]`):
`{id, label, kind:'items', store | derive:{lib}, labelField, fields:[{id, type, factor?:true}], blueprint:<item blueprint id>}`.

- identity: position in the store plus its `labelField` (no hidden ids; drag reorder moves the row);
- values: the typed fields; **scoring factors** are fields flagged `factor:true` (e.g. scoreM, scoreH, … for ranking; "value", "quality" in the proof);
- `_bp`: optional per-item blueprint override (else the type's `blueprint`);
- `_joy:{joyId:value}`, `_jmax`: per-item joy overrides (ADR 0052);
- `_alts:[{name, values}]`, `_alt`: alternatives (ADR 0011) — the selected alternative's values are scored; `itemScores(V, cid, altPick)` scores any pick.

`derive:{lib}` makes a read-only item type computed by a pack library (`rank.items` = rank_share calcRanks items). Library code still owns those rows (see 0054).

Components: RankList over an item type with no scorer ranks by item scores; DataTable column `score:@` shows each item's own score; JoyTable lists joys (0052).
Editor: **items** panel (types, values, ★ factor toggles, + item, duplicate ⧉, drag ⋮⋮ reorder, steppers, per-item blueprint picker, live scores, Exp6 engine status).
