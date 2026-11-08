# Art UX + profile image review artifacts (2026-11-08)

Review branch `cursor/art-ux-profile-image-15ae` · platform **1.8.4** · base `3d76da1`.

## Coordinator copy — exact paths

| Path | What |
|------|------|
| `handoff/LATEST.txt` | Pointer to current archive + sha256 |
| `handoff/ART-PIPELINE-HANDOFF-*.tar.gz` | **Self-contained Mac handoff** (no .git/secrets) |
| `qa/GATE-MATRIX.md` | Rendered vs provisional vs blocked + exact Mac commands |
| `qa/MAC_RUNBOOK.md` | Blender 4.2.1 METAL + Moho probe steps → ArtScratch |
| `qa/EVIDENCE.md` | Classified evidence |
| `qa/missing-gates.md` | Open hardware/tool gates |
| `qa/view-matrix.md` | All shipped views coverage |
| `contact-sheets/*-provisional.svg` | Layout sheets only — **not** Blender/Moho pixels |
| `design/` `api/IMAGE-ABI.md` `lighting/fits.json` | Params/state/ABI; lighting **provisional** |
| `web/` | JRDI + chrome + UX sources packed into lean |
| `pack/metrics.json` | Lean pack chars/lines/hash/delta |
| `gifs/*-MOCK.gif` `screenshots/*.svg` | **MOCK** — not production visual evidence |

## Mac ArtScratch

`/Users/user-rodri/ArtScratch/exp7-art/<stage>/`  
Blender: `.../blender/ui-states/<run>/` · Moho: `.../moho/comparison/`

## Honest status

- JRDI + exclusive avatar + UX stamping + tests: **landed in lean**
- Blender generator METAL/4.2.1: **probe-ready**, not executed here
- Moho: **real seed .moho** + Lua scaffolds; CLI `-h` blocked; renders not executed; **no fabricated Moho output**
- Full art workflow **not complete** until Mac Blender/Moho probes + USER-HW WebGPU
