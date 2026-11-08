# Gate matrix (v5)

| Gate | Status |
|------|--------|
| Ortho DESIGN-STUDY preview + pixel gates | **runnable on cloud** (`preview_views_ortho.py`) — not METAL/WebGPU |
| Blender views content-aware frame + pixel fail | **PROBE-READY** `--only views` stage `ui-states-v5` |
| Light size/dist == params 420/900 | **FIXED in generator** (was 4.5/*0.004→0.373) |
| Shadow ground offset | **PASS** 0.309 vs 0.3249 (−4.8%) |
| Shadow penumbra | **documented difference** vs analytic 0.467 — no fake coefficient |
| Moho shapes + `-r` nonempty | **PASS** (v4) |
| Moho loop f1≈f120 | **FIX in Animate** (rest at 0 and END) — re-probe |
| Pressed vs focus | same blue OK; scale/ring weight differ — keep |
| Disabled ROI-visible | opacity 0.38 + wash 96 — re-probe |
| LIVE-GPU Safari before/after | **USER-HW OPEN** |

Still not full pass. No merge/promote.
