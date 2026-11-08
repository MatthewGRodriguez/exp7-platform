# Mac art probe runbook — rev front-readable-v3

**Do not clone repos onto the Mac.** Use `ART-PIPELINE-HANDOFF-*.tar.gz` from `/opt/cursor/artifacts`.  
**Do not change Blender/Moho settings panels.**

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
MOHO=/Applications/Moho.app/Contents/MacOS/Moho
SEED="$(pwd)/art/pipeline/moho/seed/JWorkbook_chrome.moho"
```

---

## Moho 14.3 — VERIFIED CLI (document path first)

Bare `Moho script.lua` → exit 139. **Not licensing.** Use form A/B only.

```bash
# A) VERIFIED — rc0 SMOKE_OK
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/SmokeQuit.lua"

# B) VERIFIED — rc0 writes seed_00001.png
mkdir -p "$ART_SCRATCH/moho/cli-probe"
"$MOHO" -r "$SEED" -f png -outfolder "$ART_SCRATCH/moho/cli-probe" -start 1 -end 1 -v

# Comparison → animate → render (PROBE — form A)
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/CreateExp7ArtComparison.lua"
export EXP7_MOHO_PROJECT="$ART_SCRATCH/moho/comparison/Exp7_art_comparison.moho"
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/AnimateExp7States.lua"
mkdir -p "$ART_SCRATCH/moho/render"
export EXP7_MOHO_RENDER_OUT="$ART_SCRATCH/moho/render/preview.png"
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/RenderExp7Preview.lua"
```

---

## Blender 4.2.1 METAL — front-readable-v3

Fixes Mac v2: contour rings (not torii); JRViews washes; shadow-catcher + surface pairs; Calendar/Board/Plan/chrome views.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python \
  art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json \
  --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" \
  --stage ui-states-v3 \
  --device METAL \
  --samples 64 \
  --resolution 1280x720
```

Expect: `state_*.png`, `lift_*.png`, `shadow_lift_*.png`, `surface_lift_*.png`, `tilt_*.png`, `persp_*pt.png`, `view_{calendar,board,plan,chrome}.png`, `validation.json`, `run.json`.

Pre-check:

```bash
python3 art/pipeline/blender/test_validation.py
python3 art/pipeline/blender/generate_ui_scene.py --dry-run \
  --params art/design/params.json --states art/design/state-table.json
```

After render — ROI + shadow measure (not global mean):

```bash
python3 art/pipeline/blender/measure_roi.py \
  --dir "$ART_SCRATCH/blender/ui-states-v3/<run-id>" \
  --out "$ART_SCRATCH/blender/ui-states-v3/<run-id>/measure-roi.json"
```

Reject if: ring dims ≫ panel; missing shadow/surface pairs; views lack content hierarchy; hover judged only by full-frame mean |dL|.

Analytical `art/lighting/fits.json` stays **provisional** until shadow-pass fit written.
