# Mac art probe — front-readable-v7

**Do not clone.** Use `/opt/cursor/artifacts/ART-PIPELINE-HANDOFF-*.tar.gz`.  
**Moho:** PASS (v5) — do not re-run loop.  
**Shadow-cal:** PASS offset −1.9% — **do not re-run** 6min shadow unless light changes.  
**Ortho ≠ METAL predictor.**

## Preflight (required before METAL)

```bash
python3 art/pipeline/blender/preflight_views.py
# Must PASS: ink analytical ≥4.5; opaque avatar photo loaded (not black/transparent)
```

## Views probe (cheap) then full

```bash
export ART_SCRATCH=…/run-v7-…
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v7 --device METAL \
  --probe --only views
python3 art/pipeline/blender/validate_view_pixels.py \
  --dir "$ART_SCRATCH/blender/ui-states-v7/<run>"
# Validator = semantic ROI FG(darkest 8%) vs BG(brightest 25%) ≥4.5; avatar chroma — not dark-pixel count
# If probe PASS → full 64/1280 --only views (continue-on-fail still renders all four)
```

## Expect v7
- All labels same unlit Emission ink family (secondary not pale gray)
- Chrome avatar = opaque photo on Emission plane (not black disc)
