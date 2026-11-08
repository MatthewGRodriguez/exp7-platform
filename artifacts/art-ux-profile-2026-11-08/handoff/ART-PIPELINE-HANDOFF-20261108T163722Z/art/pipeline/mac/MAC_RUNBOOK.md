# Mac art probe runbook (inventory-confirmed)

**Do not clone repos onto the Mac for this pass.** Use the `ART-PIPELINE-HANDOFF` archive only.  
**Do not change Blender/Moho app settings panels** — scripts select Cycles METAL in-session only.

## Confirmed inventory

| Tool | Path | Notes |
|------|------|-------|
| Blender 4.2.1 LTS | `/Applications/Blender.app/Contents/MacOS/Blender` | headless works; Cycles METAL Apple M3 GPU 10 cores |
| Moho 14.3 | `/Applications/Moho.app/Contents/MacOS/Moho` | `-h` yielded **no text within 20s** — CLI help **unverified**. Historical working form: `Moho script.lua` (no flags). |
| Safe outputs | `/Users/user-rodri/ArtScratch/exp7-art/<stage>/` | one heavy job at a time |

## Unpack handoff

```bash
mkdir -p /Users/user-rodri/ArtScratch/exp7-art
cd /Users/user-rodri/ArtScratch/exp7-art
tar -xzf /path/to/ART-PIPELINE-HANDOFF-*.tar.gz
cd ART-PIPELINE-HANDOFF-*
export ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
export EXP7_ART_SCRATCH="$ART_SCRATCH"
```

## Blender — first batch (states + lift series)

One heavy job; lock file `blender/.heavy.lock` blocks overlaps.

```bash
mkdir -p "$ART_SCRATCH/blender"
/Applications/Blender.app/Contents/MacOS/Blender --background --python \
  art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json \
  --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" \
  --stage ui-states \
  --device METAL \
  --samples 64 \
  --resolution 1280x720
```

Dry-run (no GPU) from any machine with Blender python unavailable:

```bash
python3 art/pipeline/blender/generate_ui_scene.py --dry-run \
  --params art/design/params.json --states art/design/state-table.json
```

Expected outputs: `$ART_SCRATCH/blender/ui-states/<run_id>/state_*.png`, `lift_*.png`, `run.json`.

After renders: measure shadow offset/blur → write `lighting/fits.measured.json` (analytical fits are **provisional only**).

## Moho — first batch probe (no fabricated CLI proof)

### A) Seed project (real historical `.moho`, not generated)

```bash
mkdir -p "$ART_SCRATCH/moho/seed" "$ART_SCRATCH/moho/comparison"
cp art/pipeline/moho/seed/JWorkbook_chrome.moho "$ART_SCRATCH/moho/seed/"
# GUI open only if needed: launch Moho empty, then File→Open (never: open -a Moho file.moho)
```

### B) Scaffold comparison scene via MohoScript (historical CLI form)

```bash
/Applications/Moho.app/Contents/MacOS/Moho \
  art/pipeline/moho/scripts/CreateExp7ArtComparison.lua
# expect stderr: EXP7_COMPARISON_SAVED .../moho/comparison/Exp7_art_comparison.moho
```

### C) Provisional state keys

```bash
export EXP7_MOHO_PROJECT="$ART_SCRATCH/moho/comparison/Exp7_art_comparison.moho"
/Applications/Moho.app/Contents/MacOS/Moho \
  art/pipeline/moho/scripts/AnimateExp7States.lua
```

### D) Render probe (success only if `RENDER_OK` appears)

```bash
export EXP7_MOHO_RENDER_OUT="$ART_SCRATCH/moho/comparison/Exp7_art_comparison_preview.png"
/Applications/Moho.app/Contents/MacOS/Moho \
  art/pipeline/moho/scripts/RenderExp7Preview.lua
```

### E) Smoke

```bash
/Applications/Moho.app/Contents/MacOS/Moho art/pipeline/moho/scripts/SmokeQuit.lua
# expect: SMOKE_OK
```

**Blocked / unverified:** any `-h`/`--help`/`--console` claims; Moho GIF export commands not inventoried here; do not invent side-by-side GIF from Moho until FileRender probe succeeds.

## Crash law (from Moho archive)

Never: `open -a Moho ANY_DOCUMENT` (SIGSEGV). Use Pro binary + MohoScript, or empty GUI then File→Open.
