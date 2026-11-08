# Lore & legacy archive migration — status

## Lore docs

| Metric | Value |
|--------|------:|
| Public-safe docs | **158** (byte-exact) |
| Redacted supplement | **41** (transformed; paths preserved) |
| Still withheld | **1** personal income/pay decision (not reconstructed) |
| Design through | **49** |
| ADR through | **0111** |
| Complete/latest Lore? | **No** |

Inventories: `lore/LORE-DOCS-PUBLIC-INVENTORY.md`, `lore/LORE-DOCS-REDACTED-INVENTORY.md`.

## ranking_ui historical source archive

| Metric | Value |
|--------|------:|
| Snapshot files from zip | **75** |
| Hash-match to zip archived SHA (except further-redacted file) | **74/74** content SHA match† |
| Further redacted in-repo | `vendor/model_tools_script.js` (schedule minutes) |
| Sanitized main UI | `archives/ranking_ui/ranking_ui.html.txt` (raw never in git) |
| Runnable / integrated? | **No** |

† Zip inventory byte-size column disagrees for 5 files whose **SHA matches** the archived hash; SHA is authoritative.

Home: [`archives/ranking_ui/`](./archives/ranking_ui/README.md).

## Remaining gaps

- Mac Lore after design 49 / ADR 0111  
- Mac ranking_ui newer than this box snapshot  
- Withheld ranking data/backups/frames (per ranking inventory)  
- Raw `ranking_ui.html` (private; sanitization source only)  
- One Lore income decision record  

## Related

- [`lore/HISTORICAL-VS-CURRENT.md`](./lore/HISTORICAL-VS-CURRENT.md)  
- [`archives/ranking_ui/SANITIZATION.md`](./archives/ranking_ui/SANITIZATION.md)  
