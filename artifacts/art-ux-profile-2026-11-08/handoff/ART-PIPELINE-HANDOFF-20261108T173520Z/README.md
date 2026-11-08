# ART-PIPELINE-HANDOFF-20261108T173520Z

Self-contained Exp7 art pipeline handoff. **No .git. No PATs/keys.**

Generator: **front-readable-v5** — content-aware framing, readable text (≥4.5 intent), visible avatar,
pixel gates (not object-count), light=params size/dist, Moho loop closure, ortho preview proofs.
Fail evidence: v1–v4 under `qa/mac-fail-*`.

Mac: prefer `--only views|states|shadow`. Run `preview_views_ortho.py` + `validate_view_pixels.py` before METAL.

Still not a full visual QA pass. Do not merge/promote. CI green ≠ visual QA.
