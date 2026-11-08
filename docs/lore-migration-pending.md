# Lore-repo documentation migration — status

## Status (updated 2026-11-08, docs PR)

A **public-safe historical snapshot** was imported into [`lore/`](./lore/README.md).

| Metric | Value |
|--------|------:|
| Archived documents imported (inventory) | **158** |
| Inventory file | `lore/LORE-DOCS-PUBLIC-INVENTORY.md` |
| SHA-256 checks vs inventory after copy | **158/158 match**, 0 mismatch |
| Withheld (not in package; counts only) | **42** |
| Further exclusions after import scan | **0** |
| Design docs included through | **49** |
| ADRs included through | **0111** |
| Lore history / Mac freshness guarantee | **None** |

This is **not** a complete or latest canonical Lore migration. Later Mac docs (design >49, ADR >0111, other trees) remain **unknown / out of package**. Authoritative Lore stays on the owner’s Mac.

## Withheld (42) — counts only; do not reconstruct

Per package inventory (do not invent contents):

- 35 — personal financial data  
- 4 — local personal identifiers (machine paths)  
- 2 — private-data location / exposure description  
- 1 — agent operating instructions / persona-runtime (not software docs)  

Also omitted by packager: source/code payloads, JEditor source, macOS metadata, user-uploaded HTML.

## Checklist

| Item | Source | Destination | Done? |
|------|--------|-------------|-------|
| Public-safe JEditor docs snapshot | Attached zip (`jeditor/…`) | `docs/lore/jeditor/` | Yes (byte-exact) |
| Public-safe living-core top docs | Attached zip (`living-core/…`) | `docs/lore/living-core/` | Yes (byte-exact) |
| Package inventory + hashes | Attached zip | `docs/lore/LORE-DOCS-PUBLIC-INVENTORY.md` | Yes |
| Post-49 designs / post-0111 ADRs / other Mac Lore | Mac Lore (not in package) | — | **No — freshness gap** |
| 42 withheld records | — | — | **Never publish from this agent** |

## Related

- [`lore/HISTORICAL-VS-CURRENT.md`](./lore/HISTORICAL-VS-CURRENT.md) — conflicts with newer requirements  
- [`requirements-vs-main.md`](./requirements-vs-main.md) — live platform gaps  
