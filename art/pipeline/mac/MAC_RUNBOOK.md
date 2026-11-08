# Mac art probe runbook — rev front-readable-v6

**Do not clone repos.** Use `/opt/cursor/artifacts/ART-PIPELINE-HANDOFF-*.tar.gz`.  
**Do not duplicate** a Mac run already in flight. Prefer `--probe` then focused `--only`.

## Moho — DONE (v5 PASS)
34 shapes, 120 frames / 102 unique, `|f0−f120|=0`. **No further Moho loop experiments.**

## Blender views (v5 FAIL → v6 unlit text)

```bash
export ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
# NEW scratch dir — do not overwrite in-flight run
"$BLENDER" --background --python art/pipeline/blender/generate_ui_scene.py -- \
  --params art/design/params.json --states art/design/state-table.json \
  --scratch "$ART_SCRATCH" --stage ui-states-v6 --device METAL \
  --probe --only views
# Expect: flat unlit emission text (no extrude/ghost); continues board/plan/chrome after calendar pixel fail
# Full after probe green:
"$BLENDER" … --stage ui-states-v6 --samples 64 --resolution 1280x720 --only views
python3 art/pipeline/blender/validate_view_pixels.py --dir "$ART_SCRATCH/blender/ui-states-v6/<run>"
```

Cloud ortho ≠ METAL predictor (v5 proved this).

## Shadow-cal (full penumbra)

```bash
"$BLENDER" … --only shadow --stage ui-states-v6
# Emits shadow_lift_* (beauty; y90 may occlude) AND shadow_cal_lift_* (caster invisible to camera)
# Fit shadow_cal only; report uncertainty vs analytic 0.4667 — do not force-match.
# v4 offset 0.309 applies to OLD light only; v5 beauty offset contaminated.
```

## Light
Must log `dist_m=9 size_m=4.2 size/dist=0.4667`.
