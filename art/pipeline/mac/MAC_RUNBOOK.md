# Mac art probe runbook — rev front-readable-v5

**Do not clone repos.** Use `/opt/cursor/artifacts/ART-PIPELINE-HANDOFF-*.tar.gz`.  
**Prefer `--only`** — avoid re-rendering unchanged expensive series.  
v4 FAIL: cropped views, faint text, invisible avatar, light 4.5/*0.004, Moho loop open.

## Unpack

```bash
export ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
mkdir -p "$ART_SCRATCH" && cd "$ART_SCRATCH"
tar -xzf /path/to/ART-PIPELINE-HANDOFF-*.tar.gz && cd ART-PIPELINE-HANDOFF-*
export EXP7_ART_SCRATCH="$ART_SCRATCH"
MOHO=/Applications/Moho.app/Contents/MacOS/Moho
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
SEED="$(pwd)/art/pipeline/moho/seed/JWorkbook_chrome.moho"
```

## Preflight (pixel gates — run before METAL)

```bash
python3 art/pipeline/blender/test_validation.py
python3 art/pipeline/blender/preview_views_ortho.py \
  --out "$ART_SCRATCH/ortho-preview"
# Must exit 0: readable title "November…", contrast≥4.5, chrome avatar visible.
# Label: DESIGN-STUDY-ORTHO — not METAL, not WebGPU.
```

## Blender METAL — focused

```bash
# Views only (content-aware framing + pixel fail stops render series)
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v5 --device METAL --samples 64 \
  --only views

python3 art/pipeline/blender/validate_view_pixels.py \
  --dir "$ART_SCRATCH/blender/ui-states-v5/<run>" \
  --out "$ART_SCRATCH/blender/ui-states-v5/<run>/pixel-validation.json"

# States only if needed (pressed≠focus by scale/ring weight; disabled ROI)
"$BLENDER" … --only states --stage ui-states-v5

# Shadow only if re-checking after light unify (size/dist == 420/900)
"$BLENDER" … --only shadow --stage ui-states-v5
```

Light must log `size/dist≈0.4667`. Offset PASS (~0.309 vs 0.3249) stands; blur differs from analytic — document, don't fake.

## Moho — shapes + closed loop + `-r`

```bash
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/CreateExp7ArtComparison.lua"
export EXP7_MOHO_PROJECT="$ART_SCRATCH/moho/comparison/Exp7_art_comparison.moho"
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/AnimateExp7States.lua"
# Animate keys rest at f=0 and f=120 (loop closure)
mkdir -p "$ART_SCRATCH/moho/render"
"$MOHO" -r "$EXP7_MOHO_PROJECT" -f png -outfolder "$ART_SCRATCH/moho/render" -start 1 -end 120 -v
# LOOP_CHECK: |f1 − f120| ≈ 0
```

No FileRender Lua. Empty/transparent sets = FAIL.

## Fits

`art/lighting/fits.json` — measured offset PASS; penumbra finite-area ≠ analytic; generator light unified to params.
