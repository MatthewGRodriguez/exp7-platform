# Missing / pending gate matrix (exact commands)

Legend: **rendered** = Mac GPU/tool output required · **provisional** = analytical / code-only · **blocked** = tool/CLI unverified

| Gate | Class | Executable / command | Output path | Status |
|------|-------|----------------------|-------------|--------|
| Blender UI states + lift series | rendered | `/Applications/Blender.app/Contents/MacOS/Blender --background --python art/pipeline/blender/generate_ui_scene.py -- --params art/design/params.json --states art/design/state-table.json --scratch /Users/user-rodri/ArtScratch/exp7-art --stage ui-states --device METAL --samples 64` | `/Users/user-rodri/ArtScratch/exp7-art/blender/ui-states/<run>/` | **PROBE-READY** (not run here) |
| Blender dry-run validate | provisional | `python3 art/pipeline/blender/generate_ui_scene.py --dry-run --params art/design/params.json --states art/design/state-table.json` | stdout JSON | runnable on cloud |
| Measured lighting fits | rendered | Trace PNGs from Blender run; write `fits.measured.json` | ArtScratch + handoff `lighting/` | **OPEN** — analytical `art/lighting/fits.json` is **provisional** |
| Caustics on/off 2 seeds + 512 | rendered | Extend generator after first probe; not enabled (`params.light.caustics=false`) | ArtScratch | **BLOCKED** until base series done |
| Moho smoke | rendered | `/Applications/Moho.app/Contents/MacOS/Moho art/pipeline/moho/scripts/SmokeQuit.lua` | stderr `SMOKE_OK` | **PROBE-READY** |
| Moho comparison scaffold | rendered | `/Applications/Moho.app/Contents/MacOS/Moho art/pipeline/moho/scripts/CreateExp7ArtComparison.lua` | `$EXP7_ART_SCRATCH/moho/comparison/Exp7_art_comparison.moho` | **PROBE-READY** (real Lua + seed; not executed here) |
| Moho animate states | rendered | `EXP7_MOHO_PROJECT=... /Applications/Moho.app/Contents/MacOS/Moho art/pipeline/moho/scripts/AnimateExp7States.lua` | same .moho | **PROBE-READY** provisional keys |
| Moho FileRender probe | rendered | `EXP7_MOHO_RENDER_OUT=...png /Applications/Moho.app/Contents/MacOS/Moho art/pipeline/moho/scripts/RenderExp7Preview.lua` | png under ArtScratch | **PROBE-READY** — success only if `RENDER_OK` |
| Moho `-h` / help | blocked | `/Applications/Moho.app/Contents/MacOS/Moho -h` | — | **BLOCKED** (no text ≤20s) |
| Moho side-by-side GIF | blocked | (no verified CLI) | — | **BLOCKED** — do not fabricate |
| Perspective VP tests | provisional | `node art/perspective/perspective-tests.mjs` | `artifacts/.../perspective/results.json` | runnable |
| JRDI unit + lifecycle | provisional | `node tests/jrender-images.test.mjs` · `node tests/jrender-images-lifecycle.test.mjs` | stdout | runnable **[MOCK]** |
| Exclusive avatar paint | provisional | lifecycle tests + `JRender.Images.exclusiveAvatarPaint` | — | code+tests |
| Pack metrics | provisional | `node tools/pack-art-lean.mjs` | `artifacts/.../pack/metrics.json` | runnable |
| Exp7Slabs.verify('vf-cal') | rendered | Safari WebGPU on Matthew Mac | — | **USER-HW OPEN** |
| Contrast ≥4.5 text-hidden pixels | rendered | Mac GPU readback | — | analytical palette only here |
| Idle rAF / recalc / p95 frames | rendered | Mac | — | **OPEN** |
| Contact sheet rasters from Blender | rendered | assemble from ArtScratch PNGs | ArtScratch | SVG layout sheets in repo are **provisional layout only** |

Cloud agent: **no Blender/Moho/GPU** — never blanket-pass rendered rows.
