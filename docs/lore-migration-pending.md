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

## Artist / JRender / animation coordination archive

| Metric | Value |
|--------|------:|
| Manifest-listed docs | **44** |
| Package extras | **2** (`MANIFEST.md`, `historical-context.md`) |
| In-repo overview + privacy note | **2** (`README.md`, `PRIVACY-REVIEW.md`) |
| Package SHA verified in-repo | **44/44** |
| Path-redacted (`modified: yes`) | **8** |
| Secrets/finances reported or found | **None** |
| Artist contacted? | **No** (not authorized) |

Home: [`archives/artist-jrender/`](./archives/artist-jrender/README.md).

**Do not confuse:** Artist 2026-10-30 TDD/Slate CSS player workflow ≠ Exp7 WebGPU/JRender view animation rules. Template ≠ execution. core-wasm+JS ≠ unfinished WASI 0.3. v13 user visual ≠ GPU QA. Atlas/storage wait on Artist remains **OPEN**.

## Remaining gaps

- Mac Lore after design 49 / ADR 0111  
- Mac ranking_ui newer than this box snapshot  
- Withheld ranking data/backups/frames (per ranking inventory)  
- Raw `ranking_ui.html` (private; sanitization source only)  
- One Lore income decision record  
- Artist report **quality-gates** section cut off (source gap; do not invent)  
- Artist full reply on storage/op rules **not archived**  
- Confirmation that Artist **pending storage update** arrived: **none**  
- Later Mac Artist/JRender mail beyond this package  

## Related

- [`lore/HISTORICAL-VS-CURRENT.md`](./lore/HISTORICAL-VS-CURRENT.md)  
- [`archives/ranking_ui/SANITIZATION.md`](./archives/ranking_ui/SANITIZATION.md)  
- [`archives/artist-jrender/historical-context.md`](./archives/artist-jrender/historical-context.md)  
- [`archives/artist-jrender/PRIVACY-REVIEW.md`](./archives/artist-jrender/PRIVACY-REVIEW.md)  
