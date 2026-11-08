# WASI 0.3 component path (JRender) — stage 1

**WASI version: 0.3 only** (`wasm32-wasip3`). Do not confuse with wasip2 / WASI 0.2.

## What works now (tested)

| Piece | Evidence |
|---|---|
| Guest crate | `sm_pose_component/` — WIT world `sm` exports `jrender:sm-pose/mixer@0.1.0` |
| Build | `cargo +nightly build --release --target wasm32-wasip3` |
| Artifact | `artifacts/sm_pose_wasip3.wasm` (~75 313 B; imports wasi:clocks@0.3.0) |
| Imports | `wasi:clocks/monotonic-clock@0.3.0`, `wasi:clocks/system-clock@0.3.0`, `wasi:cli/*@0.3.0` |
| Export | `jrender:sm-pose/mixer@0.1.0` (`go` / `tick` / `cur` / `set-edge-ms` / `get-pose`) |
| Host | `host_multitick/` — Wasmtime **51.0.0-rc.1** + `wasmtime_wasi::p3` |
| Multi-tick | Same instance: idle→invalid across 0..120 ms, then invalid→pressed; poses match ViewStates `POSES` |
| Report | `artifacts/multitick_report.json` (`ok: true`) |

Toolchain (Mac, verified this run):
- rustc 1.101.0-nightly (249c1e4e3 2026-11-05)
- wasm-tools 1.263.0
- wasmtime 51.0.0-rc.1

## Build & test

```sh
export PATH="$HOME/.cargo/bin:$PATH"
cd wasi03/sm_pose_component
cargo component bindings
cargo +nightly build --release --target wasm32-wasip3
cp target/wasm32-wasip3/release/sm_pose.wasm ../artifacts/sm_pose_wasip3.wasm
wasm-tools validate ../artifacts/sm_pose_wasip3.wasm
wasm-tools component wit ../artifacts/sm_pose_wasip3.wasm   # must show wasi:*@0.3.0 + mixer export

cd ../host_multitick
cargo build --release
./target/release/host_multitick ../artifacts/sm_pose_wasip3.wasm ../artifacts/multitick_report.json
```

## Host glue that remains (honest)

| Concern | In component? | Host |
|---|---|---|
| Pose / view.states subset | **Yes** (this stage) | Wasmtime p3 linker |
| WebGPU / canvas / swapchain / rAF | **No** — no WASI WebGPU world | Custom JS/native host (unchanged) |
| DOM TextField / IME | **No** | DOM host |
| Full tessellation `jr_*` / JRB Machine fish·coin·button | **Not yet** | Still core wasm + JS |
| Atlas eval / proposals / circuits | **Not yet** | Still Exp7 JS |

## Not done (next stages)

1. Expand WIT (`jr-layout`, `jr-dl-patch`, atlas eval slices) with real Rust ports + multi-call tests.
2. Wire demo/browser via a real component host (Shortcuts / jco preview3 / custom); bare `WebAssembly.instantiate` rejecting components is expected, not a blocker.
3. Keep shipping core `wasm32-unknown-unknown` baseline until component path covers demo matrix.
4. Do **not** treat wasip2 artifacts as 0.3 evidence.

## vs prior spike (`deliver/.../wasi03_spike`)

Spike built wasip3 **without** WIT-exported `sm_*` (C ABI on embedded core only; no multi-call component host). This tree lifts mixer into the component world and runs multi-tick Wasmtime calls.
