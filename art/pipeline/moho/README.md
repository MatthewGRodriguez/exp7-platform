# Moho handoff

## Verified CLI (Mac Moho 14.3 — 2026-11-08)

**Document path first.** Bare `Moho script.lua` exits 139 (wrong argv, not licensing).

```bash
MOHO=/Applications/Moho.app/Contents/MacOS/Moho
SEED="$(pwd)/art/pipeline/moho/seed/JWorkbook_chrome.moho"
SCRATCH="${EXP7_ART_SCRATCH:-/Users/user-rodri/ArtScratch/exp7-art}"

# A) Startup script — VERIFIED rc0 SMOKE_OK
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/SmokeQuit.lua"

# B) CLI render — VERIFIED rc0 writes seed_00001.png
mkdir -p "$SCRATCH/moho/cli-probe"
"$MOHO" -r "$SEED" -f png -outfolder "$SCRATCH/moho/cli-probe" -start 1 -end 1 -v
```

## Next probes (form A with abs paths)

```bash
export EXP7_ART_SCRATCH="$SCRATCH"
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/CreateExp7ArtComparison.lua"
# then:
export EXP7_MOHO_PROJECT="$SCRATCH/moho/comparison/Exp7_art_comparison.moho"
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/AnimateExp7States.lua"
export EXP7_MOHO_RENDER_OUT="$SCRATCH/moho/render/preview.png"
mkdir -p "$(dirname "$EXP7_MOHO_RENDER_OUT")"
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/RenderExp7Preview.lua"
```

## Real artifacts

| Artifact | Provenance |
|----------|------------|
| `seed/JWorkbook_chrome.moho` | Archived living-core Moho 14.3 project — **not fabricated** |
| Lua probes | Historical + Exp7 scaffolds |

See `BLOCKED.md` for fail history + open FileRender/GIF status.
