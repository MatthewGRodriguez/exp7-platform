# Gate matrix (v4)

| Gate | Class | Status |
|------|-------|--------|
| Blender ui-states-v4 views (text+avatar DESIGN-STUDY) | rendered | **PROBE-READY** `--only views` — content validation required |
| Blender states semantic fix | rendered | **PROBE-READY** `--only states` |
| Blender v3 Mac run | fail quality | views=generic bars; drop-pending≈invalid; pressed/disabled weak; image-px shadow ≠ ground |
| Shadow ground unprojection | provisional | `calibrate_shadow_ground.py` + `camera_instrumentation.json` — fits stay provisional |
| Moho form A/B | verified | doc-first + `-r` |
| Moho Create with shapes | rendered | **PROBE-READY** — must log shapes>0; empty FAIL |
| Moho Animate | rendered | refuses empty layers |
| Moho FileRender Lua | fail | exit 139 — **do not use** |
| Moho `-r` multi-frame | rendered | only after shapes exist |
| Live Safari WebGPU before/after | USER-HW | **OPEN** — cloud has no accepted GPU proof |
| Analytical fits.json | provisional | image-space slopes **rejected** as model |

CI green ≠ visual QA. Still not full pass. Do not merge/promote.
