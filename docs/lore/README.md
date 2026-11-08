# Lore archive (historical, public-safe snapshot)

**Not** a complete or latest canonical Lore migration.

This directory holds a **byte-exact** import of the public-safe package attached for documentation PR work (2026-11-08). Documents are **historical data**. Newer user requirements in the handoff / `docs/` notes take precedence when they conflict. Unresolved conflicts are listed — not silently “fixed” by editing archive bytes.

## What is here

| Item | Count |
|------|------:|
| Archived documents (inventory rows) | **158** |
| Inventory file | 1 (`LORE-DOCS-PUBLIC-INVENTORY.md`) |
| Wrapper notes in this folder (`README.md`, `HISTORICAL-VS-CURRENT.md`) | repo-authored (not in the 158) |
| Withheld from package (privacy / local / operational) | **42** (counts only; contents not reconstructed) |

### Layout (original relative paths preserved)

```
docs/lore/
  LORE-DOCS-PUBLIC-INVENTORY.md   # package inventory + SHA-256 table
  jeditor/                        # JEditor docs snapshot (design ≤49, ADRs ≤0111)
  living-core/                    # living-core top-level software docs only
```

### Hash verification (this import)

All **158** inventory paths were re-hashed after copy into `docs/lore/`:

- **158 / 158 match** (bytes + SHA-256)  
- **0** mismatches, **0** missing, **0** extras vs inventory  

(Re-run: hash each inventory path under `docs/lore/` against `LORE-DOCS-PUBLIC-INVENTORY.md`.)

### Freshness / source gaps (do not close casually)

- Snapshot has **no Lore history** and **no freshness guarantee**.  
- JEditor box snapshot restore timestamps ~2026-11-07 00:35–00:36 CST; actual copy date unknown.  
- Included through **design docs ≤ 49** and **ADRs ≤ 0111**. Later Mac Lore docs are **unknown / not included**.  
- `living-core/` is top-level software docs from a box snapshot; Mac copy may differ.  
- Authoritative Lore remains on the owner’s Mac.  

### Sensitivity scan on import (generic)

Additional scan after unpack (not a substitute for the packager’s withhold list):

- Token / private-key patterns: **0** files  
- Home-directory absolute paths: **0** files  
- Further exclusions this pass: **0**  

False-positive “email” regex hits (kept; already in public package): Lore identity `jeditor@joy.local`; pack filename `themes@1.0.0.jpack.json`.

## How to use these files

1. Treat as background / provenance for Exp7, JFactor, Atlas, connection designs, ADRs.  
2. For **current platform product rules**, start from [`../requirements-vs-main.md`](../requirements-vs-main.md) and the handoff archive — not from these alone.  
3. See [`HISTORICAL-VS-CURRENT.md`](./HISTORICAL-VS-CURRENT.md) for known tensions.  
4. Do **not** resume canceled search/scheduler work because an older design mentions it.
