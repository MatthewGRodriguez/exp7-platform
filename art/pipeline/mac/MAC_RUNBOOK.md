# Mac art probe — front-readable-v8

**Do not clone.** Existing handoff archive remains until a **validated** probe PASS; no new archive from palette-only churn.  
**Moho:** PASS (v5) — do not re-run loop.  
**Shadow-cal:** PASS offset −1.9% — **do not re-run** unless light changes.  
**Ortho ≠ METAL predictor.** LIVE-GPU OPEN.

## Root cause (v7 FAIL) — do not re-blind-palette

1. Hardcoded title ROI `[25,14,352,57]` missed projected title `y≈86–98` → false contrast ~1.04  
2. Emission Color fed **display sRGB/255 as if linear** → ink displayed ~rgb(79) not #141822  
3. Blender 4.2 default **AgX** left unset → further wash  
4. Probe **640×360** projected weekday/day glyphs ~3–6px → AA-dominated secondary  
5. Avatar asset was **gradient ellipse** (chroma gate false-pass); not a photo/fixture  

## Cheap diagnostic (before another full probe)

```bash
"$BLENDER" --background --python art/pipeline/blender/diagnose_view_rootcause.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --out "$ART_SCRATCH/diag-v8" --view calendar --device METAL --samples 4 --render
# Prints: view_transform, emission nodes, projected glyph px @640/@1280, swatch AgX vs Standard
```

## Preflight (PIL not required)

```bash
# Prefer system python3 — stdlib PNG decoder; do NOT pip-install PIL on Mac for this gate
python3 art/pipeline/blender/preflight_views.py
# Or Blender bundled python if needed:
# /Applications/Blender.app/Contents/Resources/4.2/python/bin/python3.11 art/pipeline/blender/preflight_views.py
```

## Views probe then full

```bash
export ART_SCRATCH=…/run-v8-…
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v8 --device METAL \
  --probe --only views
python3 art/pipeline/blender/validate_view_pixels.py \
  --dir "$ART_SCRATCH/blender/ui-states-v8/<run>"
# Validator = projected text ROI sidecar + text-hidden BG mask; avatar = illustrated fixture structure
# Probe may SKIP undersampled secondary groups (honest) — production 1280 must still PASS
```

## Expect v8
- `Standard` view_transform; emission via `srgb_to_linear`  
- Sidecars: `view_*_rois.json`, `view_*_bg.png`  
- Camera push-in after framing for readable projected glyphs  
- Chrome avatar = labeled illustrated fixture (FIX badge) — not gradient-as-photo  
