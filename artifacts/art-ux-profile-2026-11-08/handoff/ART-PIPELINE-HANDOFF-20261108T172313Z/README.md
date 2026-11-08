# ART-PIPELINE-HANDOFF-20261108T172313Z

Self-contained Exp7 art pipeline handoff. **No .git. No PATs/keys.**

Generator: **front-readable-v4** — content views (typography+avatar DESIGN-STUDY), semantic state rings,
shadow ground calibration (image-px slopes rejected), Moho shapes + `-r` only.
Fail evidence: v1 slivers, v2 torii, v3 generic bars / empty Moho layers / image-space shadow mismatch.

Mac scratch: `/Users/user-rodri/ArtScratch/exp7-art` — prefer `--only views|states|shadow`.

## Start here
1. `art/pipeline/mac/MAC_RUNBOOK.md`
2. `qa/GATE-MATRIX.md` + `qa/ALL-VIEWS-QA.md`
3. Blender `ui-states-v4` with content validation (no empty views)
4. Moho Create must log shapes>0; render with `-r` (not FileRender)
5. `fits.json` provisional — do not adopt Mac v3 image-px slopes

Still not a full visual QA pass. Do not merge/promote.
CI green ≠ visual QA.
