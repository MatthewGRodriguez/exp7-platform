# Missing / pending gate matrix (exact commands)

Legend: **rendered** = Mac GPU/tool output required · **provisional** = analytical / code-only · **blocked** = tool/CLI unverified · **fail** = ran and produced unusable evidence

| Gate | Class | Executable / command | Output path | Status |
|------|-------|----------------------|-------------|--------|
| Blender UI states + lift/tilt/persp (v2) | rendered | `/Applications/Blender.app/Contents/MacOS/Blender --background --python art/pipeline/blender/generate_ui_scene.py -- --params art/design/params.json --states art/design/state-table.json --scratch /Users/user-rodri/ArtScratch/exp7-art --stage ui-states-v2 --device METAL --samples 64` | `/Users/user-rodri/ArtScratch/exp7-art/blender/ui-states-v2/<run>/` | **PROBE-READY** (generator fixed after Mac FAIL) |
| Blender v1 Mac METAL run-20261108T1045 | fail | prior handoff generator | contact-sheet-blender-metal.png | **FAIL** — edge-on ~120×17 slivers; states ≤1 luma; no tilt/persp |
| Framing/state validation (pre-render) | provisional | `python3 art/pipeline/blender/test_validation.py` + Blender `validation.json` before Cycles | stdout / ArtScratch | runnable — rejects sliver + lift-only pressed/disabled/invalid |
| Blender dry-run | provisional | `python3 art/pipeline/blender/generate_ui_scene.py --dry-run --params art/design/params.json --states art/design/state-table.json` | stdout JSON | runnable on cloud |
| Measured lighting fits | rendered | Trace frontal lift PNGs → `fits.measured.json` | ArtScratch + handoff `lighting/` | **OPEN** — analytical `art/lighting/fits.json` remains **provisional** |
| Caustics on/off | rendered | after base v2 series | ArtScratch | **BLOCKED** until frontal series measured |
| Moho bare `Moho script.lua` | fail/blocked | `/Applications/Moho.app/Contents/MacOS/Moho …/SmokeQuit.lua` | — | **FAIL observed exit 139**; do not retry as success path |
| Moho documented form A (doc+script) | blocked | `Moho /ABS/seed.moho /ABS/SmokeQuit.lua` | stderr | **BLOCKED** — researched, not proven on this Mac |
| Moho documented form B (`-r`) | blocked | `Moho -r seed.moho -f png -outfolder … -start 1 -end 1 -v` | png | **BLOCKED** — researched, not proven |
| Moho comparison / animate / FileRender | blocked | depends on non-crashing CLI | ArtScratch | **BLOCKED** |
| Moho `-h` / help | blocked | `Moho -h` | — | **BLOCKED** (no text ≤20s) |
| Moho side-by-side GIF | blocked | (no verified CLI) | — | **BLOCKED** — do not fabricate |
| Perspective VP tests | provisional | `node art/perspective/perspective-tests.mjs` | artifacts | runnable |
| JRDI unit + lifecycle | provisional | `node tests/jrender-images*.test.mjs` | stdout | runnable **[MOCK]** |
| Pack metrics | provisional | `node tools/pack-art-lean.mjs` | artifacts | runnable |
| Exp7Slabs.verify / contrast / idle rAF | rendered | Safari WebGPU on Matthew Mac | — | **USER-HW OPEN** |
| Contact sheet from Blender v2 | rendered | assemble from ArtScratch PNGs | ArtScratch | prior SVG sheets are layout-only |

Cloud agent: **no Blender/Moho/GPU** — never blanket-pass rendered rows. CI green ≠ visual QA pass.
