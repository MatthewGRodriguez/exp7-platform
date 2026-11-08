# Stage 4 continuation — NOT full migration

## Closed measured discrepancy
The old jco smoke loaded 800×525 @ DPR1 and never called resize; Wasmtime loaded 400×300 then resize DPR2 and four frames. `State::new` explicitly calls `rebuild_static(false)` and defers room geometry until resize. Thus 152 was the deferred static buffer, 4056 the resized buffer. Corrected same-state comparison produces identical SHA256 for all six buffers (0,1,2,3,5,6), not just matching lengths. Canonical list byte length equals bufLen in every call. See artifacts/jco_wasmtime_parity.json and loader/parity_runtime.mjs. No renderer computation changed to force equality.

## Implemented / verified
- Fixed real bug in stage3 rich text wrapper: packed length is L*16 + fragments*40, NOT L*24 (runtime/src/dl.rs authoritative layout).
- Async instantiation bindings + inline core-module bytes + actual browser preview3-shim bundle (no node imports, network or proxy). loadComponent verified executing in Node JSPI using actual browser shim.
- loader/parity_drawlist.mjs: 22 checks PASS through inline async component vs core, real rect/text/glyph/font/load/patch/hit/measure/wrap and SHA256 buffer parity. Core no-hit -1 converted to WIT u32 4294967295, not hidden.
- loader/parity_scenes.mjs: 150 checks PASS (raw button/fish/coin + original scene.jrbx + proper button/coin/fish JRBX roles 0/1/2), four actual frame calls each and six buffer digests per frame.
- Wasmtime p3 vs core: original scene.jrbx and button_coin_fish.jrbx equal=true; ui_slab fresh equal=true.
- Single-file component WebGPU render staging authored: artifacts/component-render-staging.html, 979704 bytes at initial build. Actual browser-shim and component-driven geometry/text/hit/patch; export counters; explicit JSPI/WebGPU diagnostics. Source build: loader/build_browser.sh. Browser GPU execution NOT verified here; this is staging, not accepted integrated demo.

## Exact remaining
- Existing private Exp7 demo v11 remains untouched. Rendering staging is not the production calendar/UI integration. No GPU1/0 file/http matrix claimed.
- Browser-execution validation needed for staging and integration (a browser executor was not available in this executor tool catalog).
- Rich-text packed length fix built, but dedicated rich test still required (22-check suite tests text/wrap, not rich).
- Existing Exp7 Lore100 source audit IMPORTANT: prior “20/20” is fixture coverage, NOT production feature coverage. score_item(world_json, ...) ignores world_json and uses world_from_score_fixture; pick_alts/day_map/ledger exported functions also ignore caller world and return fixture paths. circuit_score_blueprint is a hardcoded one-expression lowerer. Do NOT integrate those exports or repeat stage3 broader coverage claim. Replace these with real JSON model/ports or explicit diagnostic errors, remove -cost fallback, implement full formula/deps/SCC/proposals/Best/itemFlags as requested. Lore100 not changed in this stage.
- No 365/full regression count claimed. Actual checks here: 22 draw-list checks; 150 scene checks; 6 runtime buffer digest comparisons; three fresh Wasmtime/core fixture comparisons.

Mac authoritative source retained; local-only git; backup directory retained; no world edits, ports, remotes, proxy or external messages.
