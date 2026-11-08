# Mac art probe runbook (inventory-confirmed) — rev front-readable-v2

**Do not clone repos onto the Mac.** Use the `ART-PIPELINE-HANDOFF-*.tar.gz` from `/opt/cursor/artifacts`.  
**Do not change Blender/Moho settings panels.**

Prior fail (run-20261108T1045): edge-on slivers, states indistinguishable, no tilt/persp — generator fixed in this handoff. Moho bare `Moho script.lua` exited **139**; stage remains BLOCKED pending documented CLI form.

## Inventory

| Tool | Path |
|------|------|
| Blender 4.2.1 LTS | `/Applications/Blender.app/Contents/MacOS/Blender` |
| Moho 14.3 | `/Applications/Moho.app/Contents/MacOS/Moho` |
| Scratch | `/Users/user-rodri/ArtScratch/exp7-art/<stage>/` |

## Unpack

```bash
export ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
mkdir -p "$ART_SCRATCH"
cd "$ART_SCRATCH"
tar -xzf /path/to/ART-PIPELINE-HANDOFF-*.tar.gz
cd ART-PIPELINE-HANDOFF-*
export EXP7_ART_SCRATCH="$ART_SCRATCH"
```

## Blender (PROBE — required)

Validates framing (rejects slivers) before Cycles METAL renders. One heavy lock.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python \
  art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json \
  --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" \
  --stage ui-states-v2 \
  --device METAL \
  --samples 64 \
  --resolution 1280x720
```

Expect: `state_*.png`, `lift_*.png`, `tilt_*.png`, `persp_*pt.png`, `validation.json`, `run.json`.  
Reject if `validation.json` framing fails or disabled/invalid/pressed ≈ idle.

Dry-run (no GPU):

```bash
python3 art/pipeline/blender/generate_ui_scene.py --dry-run \
  --params art/design/params.json --states art/design/state-table.json
```

## Moho (BLOCKED on this Mac until CLI form succeeds)

Failed form (do not retry as success path):

```bash
# OBSERVED: exit 139 SIGSEGV, empty logs
/Applications/Moho.app/Contents/MacOS/Moho art/pipeline/moho/scripts/SmokeQuit.lua
```

Documented candidates to try next (Lost Marble forum / Moho 14.2 startup scripts + `-r` FAQ). Use **absolute** paths. Success = exit 0 + logs / PNG — not assumed:

```bash
SEED="$(pwd)/art/pipeline/moho/seed/JWorkbook_chrome.moho"
OUT="$ART_SCRATCH/moho/cli-probe"
mkdir -p "$OUT"

# A) Startup script with document + script (14.2+)
/Applications/Moho.app/Contents/MacOS/Moho \
  "$SEED" \
  "$(pwd)/art/pipeline/moho/scripts/SmokeQuit.lua"

# B) CLI render one frame of seed
/Applications/Moho.app/Contents/MacOS/Moho \
  -r "$SEED" -f png -outfolder "$OUT" -start 1 -end 1 -v
```

If both still SIGSEGV: leave Moho **BLOCKED**; do not open GUI as a substitute claim. Details: `art/pipeline/moho/BLOCKED.md`.

## After Blender

Measure shadow offset/blur on frontal lift series → `lighting/fits.measured.json`. Keep `fits.json` provisional until then.
