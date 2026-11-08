# Mac art probe runbook — rev front-readable-v4

**Do not clone repos.** Use `/opt/cursor/artifacts/ART-PIPELINE-HANDOFF-*.tar.gz`.  
**Do not change Blender/Moho settings panels.**  
**Avoid re-rendering unchanged expensive series** — use `--only`.

## Unpack

```bash
export ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
mkdir -p "$ART_SCRATCH" && cd "$ART_SCRATCH"
tar -xzf /path/to/ART-PIPELINE-HANDOFF-*.tar.gz
cd ART-PIPELINE-HANDOFF-*
export EXP7_ART_SCRATCH="$ART_SCRATCH"
MOHO=/Applications/Moho.app/Contents/MacOS/Moho
SEED="$(pwd)/art/pipeline/moho/seed/JWorkbook_chrome.moho"
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
```

---

## Moho 14.3 — VERIFIED (document first); shapes required

Bare `Moho script.lua` → 139. **FileRender Lua → 139 — use `-r` only.**

```bash
# A) Smoke — VERIFIED
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/SmokeQuit.lua"

# B) Create comparison WITH SHAPES (must log shapes=N>0 per layer; empty = FAIL)
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/CreateExp7ArtComparison.lua"
export EXP7_MOHO_PROJECT="$ART_SCRATCH/moho/comparison/Exp7_art_comparison.moho"

# C) Animate — refuses empty layers
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/AnimateExp7States.lua"

# D) Render — proven -r ONLY (not FileRender)
mkdir -p "$ART_SCRATCH/moho/render"
"$MOHO" -r "$EXP7_MOHO_PROJECT" -f png -outfolder "$ART_SCRATCH/moho/render" -start 1 -end 1 -v
# After animate, multi-frame only if shapes exist:
# "$MOHO" -r "$EXP7_MOHO_PROJECT" -f png -outfolder "$ART_SCRATCH/moho/render" -start 1 -end 120 -v
# Reject if all frames transparent / identical empty.
```

---

## Blender 4.2.1 METAL — focused passes (v4)

```bash
# Preflight (cloud-equivalent)
python3 art/pipeline/blender/test_validation.py
python3 art/pipeline/blender/generate_ui_scene.py --dry-run \
  --params art/design/params.json --states art/design/state-table.json

# PRIORITY: content views only (typography + avatar DESIGN-STUDY)
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v4 --device METAL --samples 64 \
  --resolution 1280x720 --only views

# State semantic fix series only (pressed/disabled/focus/drop-pending)
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v4 --device METAL --samples 64 \
  --only states

# Shadow instrumentation (skip if v3 shadow pairs still valid on disk — reuse)
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v4 --device METAL --samples 64 \
  --only shadow

# Ground-space calibration note (does NOT adopt image-px slopes)
python3 art/pipeline/blender/calibrate_shadow_ground.py \
  --params art/design/params.json \
  --measured "$ART_SCRATCH/…/lighting-fits.measured.json" \
  --out "$ART_SCRATCH/lighting/calibration-note.json"
```

Views must fail validation if text/avatar counts are too low. Label = **DESIGN-STUDY** ≠ live WebGPU.

---

## Browser WebGPU before/after

**USER-HW only** (Safari WebGPU on Matthew Mac). Cloud Chrome has no accepted GPU proof here — do not accept CPU/SwiftShader fakes. Capture Cal/Board/Plan/chrome with JRDI avatar when GPU path is real.

## Fits

`art/lighting/fits.json` stays **provisional**. Mac v3 image-px offset 8.75 / blur 4 / ratio 0.46 are documented as contaminated; do not promote into model until ground unprojection.
