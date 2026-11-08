# JRender ? Exp7 whole-project comparison (Nov 6 2026)

**Audience:** Matthew, Ash  
**Baselines:** `/workspace/deliver/jrender-exp7_v3/` (previous deliver, versioned before this round), `repo_pre_exp7` for pre-Exp7 pixels, Exp7 docs under `/workspace/jed/JEditor/docs/`, demo build `/workspace/exp7demo-build/` (read-only).  
**New deliver:** `/workspace/deliver/jrender-exp7/` (this round).  
**Constraints honored:** box-only; no publish/push; no living-core; no ports 8765/8791; spike `world.json` / `ranking_world.html` **size metadata only** (contents not dumped).

Matthew clarifications applied:
- Prefer evaluating a full WASI 0.3 migration over JS -- **preference to evaluate, not a migration order**.
- WebGPU and WASI 0.3 are **assumed supported for his target users**; do not use broad browser-market compatibility as a reason against them.
- Shortcuts / no-JIT / null-origin remain **his delivery environment** constraints and stay in the measurements.

---

## 1. Executive recommendation

| Topic | Recommendation |
|---|---|
| **Ship path today** | Keep **core wasm** (`wasm32-unknown-unknown`, **0 imports**) + thin JS host (`jrender.js`) for WebGPU/canvas/events/rAF. This is what is tested and loads in headless Chrome/Node on the box. |
| **WASI 0.3 migration** | **Do not migrate the delivery yet.** WASI 0.3 is buildable here (`wasm32-wasip3` nightly; WIT `wasi:clocks@0.3.0`), but the spike still lacks a WIT **export** world for `sm_*`/`jr_*` and a multi-call component host path. Keep core wasm + JS host until that engineering lands. WebGPU remains a **custom host binding** (no WASI WebGPU world). `wasm32-wasip2` is WASI **0.2**, not 0.3. Bare browser `WebAssembly` rejecting components is expected, not an argument against a component host. |
| **Animation** | **Retain** JRB Machine (fish/coin/button) -- quality bar. **Add** Exp7 `view.states` via JS `ViewStates` (this round) for DL scenes. Do not replace fish/coin with CSS cues. |
| **Compression** | Keep JRB scenes + JRP for single-file dist. Atlas columnar/JRP from the spike is the right tool for **atlas** payloads, not a replacement for JRender's tessellation buffers. |
| **Artist footguns** | Fixed in library this round (richText lineHeight px misuse; TextField Safari opacity/z-index). |

---

## 2. Inventory -- what actually exists (paths)

### JRender
| Area | Path |
|---|---|
| Tessellation / legacy frame loop | `repo/runtime/src/{geom,tess,lib}.rs` |
| JRB parse + Machine (lift/tilt/scale/op/ring) | `repo/runtime/src/jrb.rs` |
| Coin / fish rigs | `repo/runtime/src/{coin,fish,rig}.rs` |
| Draw-list + patches + text | `repo/runtime/src/dl.rs` |
| JS host (Core, Renderer, GPUContext, TextField, **ViewStates**) | `repo/web/exp7/jrender.js` |
| Classic IIFE | `repo/web/exp7/jrender.classic.js` |
| Format / Host ABI | `repo/format/JRB.md` ("core wasm exports; no wasm-bindgen, no WASI imports") |
| Build | `repo/tools/build_runtime.sh` -> **only** `wasm32-unknown-unknown` |
| Dist pack (JRP + b7) | `repo/tools/build_dist.py` |
| Atlas codec spike (private) | `/workspace/td/jrender/spike/{world_codec,atlas_codec}/` |
| ASM demo (this round) | `repo/web/exp7/asm_demo.{src.js,html}` |

### Exp7 / JEditor
| Area | Path |
|---|---|
| Spec (atlas, joys, circuits, proposals, views never write) | `jed/JEditor/docs/design/42-exp7-spec.md` (+ spike copy) |
| JMotion model | `jed/JEditor/docs/design/02-animation-binary.md` |
| `view.states` -> `{bg,border,sm,anim}` | ADR 0089, ADR 0082 |
| janim validate / scopedCss | `jed/JEditor/builder/janim.js` |
| Demo host + JRender views | `/workspace/exp7demo-build/app.js`, `views.part.js` |
| Artist notes | `/workspace/deliver/exp7-demo/ARTIST-*.md` |

---

## 3. Architecture / data model

| | **Exp7** | **JRender** | Common ground | Who is stronger / what to take |
|---|---|---|---|---|
| World model | Atlas: items, joys, circuits, components, rev, proposals | Scene graph: paths, paints, nodes, optional Machine, layers, timeline | Both separate **data** from **view** | Exp7 owns app state; JRender owns GPU-ready geometry. **Keep split.** Views never write (spec ?5) matches JRender as a pure renderer. |
| Mutation | Pass evaluates dirty circuits -> proposals -> merge | DL load + Patch (replace/color/xform/flags/...) | Incremental update | JRender patches are the right GPU bridge; Exp7 proposals should keep compiling to patches (Ash's JRViews path). |
| Identity | `item:` `joy:` `circ:` `comp:` refs | Numeric node ids (+ XOR bands for TextField) | Stable ids for hit/patch | **Compatibility decision:** document id bands vs atlas refs (Ash). |
| Components / views | `view.layout`, `view.states`, theme tokens | DL nodes + optional `ViewStates` binder (new) | Named visual states | Bridge subset of Exp7 state records on DL nodes (see ?5 / ?11); not full JMotion. |

**Do not merge** atlas evaluation into wasm frame loop. Pass/eval stays in Exp7 JS/runtime; JRender stays a tessellator + GPU drawer + local SMs.

---

## 4. Compression / codecs

| Artifact | Bytes (raw) | Notes |
|---|---|---|
| `scene.jrbx` (room+coin+fish) | 81,412 | Binary JRBX |
| `coin.jrb` / `fish.jrb` / `room.jrb` / `ui_slab.jrb` | 24,388 / 50,243 / 6,762 / 1,133 | Bare `.jrb` = **room role only** if not in JRBX |
| `jrender_full.wasm` (opt s) | 208,675 | 0 imports |
| `jrender_full_fast.wasm` (opt 3) | 260,133 | 0 imports |
| `jrender.wasm` dist (fixed resize guard) | 130,710 | sha changed vs old 130,698 / `58205715` |
| `jrender.js` / classic | ~70,213 / ~70,442 | ASCII |
| `asm_demo.html` / `demo.html` | ~419k / ~425k | Inlined wasm+fonts base64 |
| `dist/jrender.html` | 111,687 | JRP-packed single page |
| Spike `world.json` (meta only) | 1,286,262 | Contents not read |
| Spike codec wasm (atlas_codec) | ~385k | Separate from JRender runtime |

Spike finding (SPIKE.md, already measured): structural columnar transform ~ size of JRP-on-JSON, but **decode ~2.1x faster** because modeled bytes drop. F4n (fast) vs M7 (strong) profiles are for **atlas** storage, not for replacing JRB tessellation.

**Recommendation:**  
- **Atlas delivery** -> keep spike F4n/M7 work; Ash wires decode workers.  
- **JRender scenes** -> keep JRB/JRBX; dist keeps JRP.  
- **Do not** force atlas codec through the renderer wasm (different job, would bloat no-JIT decode).

---

## 5. Runtime / state / evaluation

| | Exp7 | JRender |
|---|---|---|
| Evaluation | Pass over dirty circuits on one snapshot; deferred re-entry | `jr_frame` / `jrd_*` + JS rAF; dirty flags drive GPU uploads |
| Idle policy | No idle rAF (JMotion) | Demo rAF while animating; ViewStates.tick returns dirty so host can skip |
| Reduced motion | Off transitions / ambient | `jr_reduced` / ViewStates.setReduced snaps poses, kills pulse/shake/glow |

**Bidirectional improvements**
- **Exp7 -> JRender (done, bridge subset):** `ViewStates` implements the **view.states record shape** `{bg, border, sm, anim}` with `anim` in none|pulse|shake|glow and **named** JMotion poses from TDD/janim defaults, plus a **fixed** `edgeMs` ease-out. This is **not** full JMotion (no per-`from>to` edge table, ambient drift, or parallax) -- those remain deferred (see ?11).  
- **JRender -> Exp7:** share one `GPUContext` + one Core (demo already does); prefer patches over full HTML->DL rebuilds when only state colors/anims change (Ash).  
- **Retain:** fish Idle/Follow/Arrive/Turn and coin timeline in wasm -- higher quality than CSS cue keyframes.

---

## 6. Animation test cases (this round)

| Case | How exercised | Result |
|---|---|---|
| Fish + coin | `scene.jrbx` via `legacy_fish_coin_button` node test: determinism dump + pointer drive + `jr_seek` | **PASS** -- anim flags, deterministic cold dump |
| Button SM | `room.jrb` pointer enter/down/up -> ANIM + click | **PASS** (1 click) |
| Exp7 view.states | Node `view_states` + `asm_demo` (critical shake, pulse, glow, proposal->state) | **PASS** node; browser results in `tests/asm_results.json` |
| New examples | Calendar risk cards; clock/joy tick pulse?glow; circuit emit -> proposal -> target state | In `asm_demo.html` |

**Important semantics:** `coin.jrb` / `fish.jrb` alone are parsed as **room-role** bare JRB (see `unbundle`). Real fish/coin require **JRBX** (`scene.jrbx`). Documented for Ash.

---

## 7. Interaction / layout / Artist notes

| Issue | Verdict | Action this round |
|---|---|---|
| richText `lineHeight` is **factor**; textBox/wrap use **px** | **Library footgun** (units undocumented / easy to misuse) | Documented; values **> 4** converted as absolute px ? max run size. Test: misuse 19 -> height 19 (not ~247). |
| TextField `opacity:0` + `zIndex:-1` | **Library footgun** for Safari focus | Defaults -> `opacity:0.01`, `zIndex:2147483646`, transparent color/bg. Host workaround can drop once Ash picks up this build. |
| Small canvas 560 clamp | Host misuse (v3) | Already documented; library has autoSize + scale mapping |

---

## 8. WebGPU setups

| | JRender | Exp7 demo host |
|---|---|---|
| Device | `GPUContext` shared; recover on `device.lost` | Uses Artist shared context |
| Pipelines | One per (device, format) | Measured builds counter in host status |
| DPR / letterbox | `resize` + `autoSize`; legacy fit letterboxes scene VB | Host sets canvas CSS vs backing |
| data: URL | Classic load works; **no WebGPU in data:** by platform rule | Host uses https/file |
| No fallback | Plain errors `no-webgpu` / `no-device` / ... | Matches Matthew: no substitute drawing |

Under Matthew's lens, WebGPU is a **target requirement**. Measured on box: SwiftShader headless Chrome path works for tests; real Safari/iPhone WebGPU **unverified** here (label only -- not a reason to avoid WebGPU).

---


## 9. WASI evaluation (corrected labels; preference, not migration)

Matthew asked to evaluate migrating toward WASI 0.3 over JS. WebGPU and WASI 0.3 are **assumed supported for his target users** -- browser-market compatibility is not a reason against them. Shortcuts / no-JIT / null-origin remain his delivery environment constraints.

### 9.1 Version map (critical -- do not conflate)

| Label | Spec | Rust target (as of 2026-11-06) | What we measured on this box |
|---|---|---|---|
| Core wasm | WebAssembly MVP/core | `wasm32-unknown-unknown` | **Shipped JRender path.** 0 imports. Loads in Node/Chrome `WebAssembly`. |
| WASI 0.1 / preview1 | Old syscall WASI | `wasm32-wasip1` | Not used for JRender. |
| **WASI 0.2 / Preview 2** | Component Model + WASIp2 | **`wasm32-wasip2`** | Historical JRender wasip2 build + spike `sm_pose_wasip2.wasm`. **This is NOT WASI 0.3.** |
| **WASI 0.3** | Component Model + WASIp3 | **`wasm32-wasip3`** | Spike `sm_pose_wasip3.wasm` built with nightly; WIT imports `wasi:clocks@**0.3.0**`. |

Earlier draft text that conflated `wasm32-wasip2` with WASI 0.3 was **wrong** and is withdrawn.

Component modules use version word `0x0001000d`. Bare `WebAssembly.instantiate` / browser `WebAssembly` rejecting that byte is **expected for components**. It is **not** evidence against running under a component host (Wasmtime, jco, a Shortcuts embedder, etc.).

### 9.2 What was actually tested vs proposed

**Tested on box (see `wasi03_spike/`):**

1. **Core twin** of a minimal pose SM (`sm_go` / `sm_tick`, idle/hover/pressed/invalid, fixed 120 ms edge): Node multi-step poses match JS `POSES` (ViewStates subset). `wasmtime 51.0.0-rc.1 --invoke sm_go` succeeds on the core module. Size **770 B**.
2. **Real WASI 0.3 component** via `cargo +nightly build --target wasm32-wasip3`: artifact **20,902 B**, `wasm-tools validate` OK, `wasm-tools component wit` shows imports **`wasi:clocks/monotonic-clock@0.3.0`** and **`wasi:clocks/system-clock@0.3.0`**, `wasmtime compile` OK (~14 ms).
3. Default `wasmtime run` on that library component fails looking for `wasi:cli/run` -- expected (no CLI world exported).

**Not tested (precise gaps):**

1. **Component-world calls to `sm_*`:** C ABI exports sit on the embedded core module; they are **not lifted** into the component world. Missing: WIT export world + wit-bindgen/cargo-component (or equivalent) + a multi-call host instance.
2. **Stable `wasm32-wasip3` std:** stable 1.99.1 lists the target but `rustup target add wasm32-wasip3` fails (no prebuilt artifacts). Nightly 1.101 has std. Rust 1.100 (~2026-11-12) expected to ship wasip3 std on stable -- **unverified here until then**.
3. **JRender full runtime under WASI 0.3** (tessellation + jrd_*): not ported.
4. **WebGPU via WASI:** no standard WASI WebGPU world. Even with WASI 0.3 assumed for users, canvas/device/events remain a **custom host binding** (JS today, or a future embedder WIT).

**wasip2 results are labeled WASI 0.2 only** and are **not** a proxy for WASI 0.3.

### 9.3 Eliminating JS -- architecture, not slogans

| Work | Can leave JS under WASI 0.3 host? |
|---|---|
| Pose / button SM / tessellation / layout | **Yes, in principle** -- move behind WIT; host calls exports. Spike shows the pose slice builds as a 0.3 component. |
| WebGPU device, canvas, swapchain, rAF | **No standard WASI API** -- host glue remains (JS or native embedder). |
| DOM TextField / IME / clipboard | Host/DOM glue remains. |
| Atlas decode workers | Separate codec wasm; can also be components, still scheduled by a host. |

So "migrate completely to WASI 0.3 over JS" is realistic for **compute**, not for **removing all host glue** around WebGPU/input.

### 9.4 Evidence-based recommendation (corrected)

**Keep shipping core `wasm32-unknown-unknown` + thin JS host for now.**

Why (implementation quality / architecture / measured facts -- not browser-market FUD, and not "wasip2 failed instantiate"):

1. The production JRender ABI and tests are on **core wasm** with proven pixel/determinism bars.
2. WASI 0.3 is **real and buildable** on this box (nightly wasip3 + Wasmtime 51), but the spike is a **library component without a WIT export world**, so the interesting multi-tick SM path under a component host is **still unfinished engineering**, not a flip of `--target`.
3. Full migration needs: WIT for `jr_*`/`jrd_*` (or a curated subset), binder, host that owns WebGPU, and a stable wasip3 std in the CI toolchain Matthew uses for Shortcuts/no-JIT budgets.
4. Next concrete step if pursued: finish `wasi03_spike` with a WIT export world + Wasmtime embedding that matches Node core_equiv poses; only then consider swapping ship artifacts.

Spike paths: `/workspace/deliver/jrender-exp7/wasi03_spike/` (README, `sm_pose/`, `artifacts/`).

## 10. Correctness / performance / determinism (this round)

| Check | Result |
|---|---|
| Node tests | **28/28** passed (includes view_states, rich_lineheight_units, legacy_fish_coin_button) |
| Legacy cold dump determinism | scene.jrbx + room.jrb equal across two instances |
| Old scene pixels | **0 diff x6** (`tests/legacy_px.json`). Dist HTML not rebuilt; still embeds sha `58205715` wasm. Repo `web/jrender.wasm` is resize-fixed 130,710 B as `wasm/jrender_dist_fixed.wasm` |
| ASM demo JS | ViewStates tick; screenshots `screenshots/asm/` |
| Memory (prior v3 demo) | ~37 MB wasm; GPU ~24 MB @1x / ~56 MB @2x |

---

## 11. Bidirectional improvement list (for Ash / Matthew)

### Do now (Ash, Exp7 demo -- after this report)
1. Bump embedded JRender to this deliver (ViewStates optional; TextField Safari fix; rich lineHeight guard).  
2. Pass **factors** (e.g. 1.45) into `richText` / `richLayout`; keep px for `textBox`/`wrap`.  
3. Drop host `patchTextFieldTA` once on this build.  
4. When only `view.states` colors/anims change, patch via `ViewStates.go` instead of full HTML->DL relayout.  
5. Remember fish/coin screenshots must use **JRBX** or dist page, not bare `coin.jrb`.

### Do now (JRender / Artist -- optional follow-ups)
1. WIT/`jr_*` spike under wasmtime (separate from ship).  
2. Wire ViewStates ring node as real outline geometry (today color/flags only).  
3. Edge table per `from>to` (full JMotion edges), not only fixed `edgeMs`.  
4. Rebuild dist HTML only if Matthew accepts new dist wasm sha (resize trap fix).

### Compatibility decisions needed from Matthew/Ash
1. Adopt ViewStates as the official bridge for `view.states`, or keep mapping only in host JRViews?  
2. Pursue WASI 0.3 WIT spike timeline vs stay on core wasm for Shortcuts v1.  
3. Whether atlas decode wasm and JRender runtime ever share a crate (probably **no** -- different size budgets).

### Retain (do not "improve away")
- JRB Machine poses/edges for button; fish & coin wasm timelines.  
- Core wasm 0-import ship path.  
- Shared `GPUContext`.  
- No WebGL2 fallback.

---

## 12. Unverified (not failures)

- Real Safari / iPhone WebGPU and IME candidate UI  
- Multi-touch outside synthetic tests  
- Shortcuts WASI 0.3 / component loader (not tested on box)
- Component-world invoke of spike `sm_*` (WIT export world not written yet)
- Stable Rust `wasm32-wasip3` std (nightly only as of 2026-11-06)  
- Pixel equality of asm_demo vs any Exp7 DOM CSS cues (different medium)

---

## 13. Deliverable paths

| Item | Path |
|---|---|
| Versioned previous | `/workspace/deliver/jrender-exp7_v3/` |
| New build | `/workspace/deliver/jrender-exp7/` |
| This report | `/workspace/deliver/jrender-exp7/EXP7_JRENDER_COMPARE.md` |
| ASM demo | `.../asm_demo.html` |
| Tests | `.../tests/` (node_tests.json, asm_results.json, legacy_px.json, ...) |


## 14. Final measured confirmations (this box run)

| Check | Result |
|---|---|
| Node tests | **28/28** (`tests/node_tests.json`) |
| ASM browser (`asm_run.mjs`) | **PASS** -- critical->invalid, proposal->critical, ANIM pulse/glow present; screenshots `screenshots/asm/asm_demo@{1,2}.png` |
| Legacy pixels pre vs new x6 | **diffPx 0** all (`tests/legacy_px.json`) |
| Core wasm imports | **0**; compile ~0.76 ms; instantiate ~1.06 ms |
| WASI 0.3 spike component | Built (`wasi:clocks@0.3.0`); core twin equiv PASS; component `sm_*` invoke not lifted yet |
| wasip2 (WASI 0.2) comparison artifact | Built; not a 0.3 proxy |
| jrender.js / classic | 70,213 / 70,442 B ASCII |
| full_small / full_fast / dist_fixed | 208,675 / 260,133 / 130,710 B |
| asm_demo.html | 419,011 B ASCII |

Versioned previous deliver: `/workspace/deliver/jrender-exp7_v3/`.  
Working deliver updated in place: `/workspace/deliver/jrender-exp7/`.
