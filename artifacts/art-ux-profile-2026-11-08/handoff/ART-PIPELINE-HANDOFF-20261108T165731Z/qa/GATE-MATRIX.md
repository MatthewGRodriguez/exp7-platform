# Missing / pending gate matrix

Legend: **rendered** · **provisional** · **blocked** · **fail** · **verified**

| Gate | Class | Command / note | Status |
|------|-------|----------------|--------|
| Blender ui-states-v3 (contour rings, washes, views, shadow pairs) | rendered | `Blender --background --python art/pipeline/blender/generate_ui_scene.py -- … --stage ui-states-v3 --device METAL` | **PROBE-READY** |
| Blender v2 Mac run-v2-20261108T1050 | fail | framing OK; rings=huge ellipses; global-mean misread hover/pressed | **FAIL quality** — evidence `qa/mac-fail-v2-20261108/` |
| Blender v1 edge-on slivers | fail | `qa/mac-fail-20261108T1045/` | **FAIL** (fixed in v2 framing) |
| Framing/ring/state unit gates | provisional | `python3 art/pipeline/blender/test_validation.py` | runnable |
| ROI + shadow measure | rendered | `measure_roi.py --dir <run>` on `shadow_lift_*` + state ROI | **OPEN** after v3 render |
| Measured lighting fits | rendered | fit offset/blur from shadow catcher vs elev/size | **OPEN** — `fits.json` provisional |
| Moho form A doc+script | verified | `Moho <abs seed> <abs SmokeQuit.lua>` → SMOKE_OK | **VERIFIED** |
| Moho form B `-r` | verified | writes `seed_00001.png` | **VERIFIED** |
| Moho bare script | fail | exit 139 | wrong argv |
| Moho comparison / animate / FileRender | rendered | form A with Create/Animate/Render scripts | **PROBE-READY** |
| Moho GIF side-by-side | blocked | until FileRender probe succeeds | **OPEN** |
| View comps Cal/Board/Plan/chrome | rendered | `view_*.png` from v3 generator | **PROBE-READY** |
| JRDI / UX state JS | provisional | lifecycle tests + `jrviews-ux-states.js` washes | runnable **[MOCK]** |
| Exp7Slabs / contrast / idle rAF | rendered | Safari WebGPU USER-HW | **OPEN** |

Cloud: no GPU. CI green ≠ visual QA pass.
