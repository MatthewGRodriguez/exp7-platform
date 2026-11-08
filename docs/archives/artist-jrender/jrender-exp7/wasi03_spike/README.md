# WASI 0.3 spike (sm_pose) -- Nov 6 2026

Minimal JMotion-like pose mixer (`sm_go` / `sm_tick` / `sm_pose_ptr`) for evaluating **actual WASI 0.3**, not wasip2.

## Version map (do not conflate)

| Name | Meaning | Rust target | This spike |
|---|---|---|---|
| WASI 0.1 / preview1 | Legacy WASI | `wasm32-wasip1` | not used |
| WASI 0.2 / Preview 2 | Component Model + WASIp2 | `wasm32-wasip2` | `artifacts/sm_pose_wasip2.wasm` (comparison only) |
| **WASI 0.3** | Component Model + WASIp3 (async-oriented) | **`wasm32-wasip3`** | **`artifacts/sm_pose_wasip3.wasm`** |
| Core wasm | No WASI | `wasm32-unknown-unknown` | `artifacts/sm_pose_core.wasm` (ship-like twin) |

`wasm32-wasip2` is **WASI 0.2**, never a proxy for WASI 0.3.

Bare `WebAssembly.instantiate` / browser `WebAssembly` rejecting a component (version word `0x0001000d`) is **expected**. It is not evidence against a component host (Wasmtime, jco, Shortcuts embedder, etc.).

## Toolchain used (box)

```
rustc 1.99.1 (stable) -- core + wasip2 builds
rustc 1.101.0-nightly (249c1e4e3 2026-11-05) -- wasip3 build
  rustup target add wasm32-wasip3 --toolchain nightly
wasm-tools 1.263.0
wasmtime 51.0.0-rc.1 (downloaded release tarball)
```

Notes: On this date, stable Rust has `wasm32-wasip3` in the target list but **no prebuilt std** (`rustup target add wasm32-wasip3` on stable fails). Nightly has std. Rust 1.100 (scheduled ~2026-11-12) is expected to bring wasip3 std to stable.

## Build commands

```sh
cd sm_pose
# Actual WASI 0.3 component:
cargo +nightly build --release --target wasm32-wasip3 --target-dir /tmp/wasip3
cp /tmp/wasip3/wasm32-wasip3/release/sm_pose.wasm artifacts/sm_pose_wasip3.wasm

# Core twin (equivalence / ship-like ABI):
cargo build --release --target wasm32-unknown-unknown --target-dir /tmp/core
cp /tmp/core/wasm32-unknown-unknown/release/sm_pose.wasm artifacts/sm_pose_core.wasm

# WASI 0.2 comparison only:
cargo build --release --target wasm32-wasip2 --target-dir /tmp/wasip2
```

## What was actually tested

| Check | Result |
|---|---|
| wasip3 artifact validates (`wasm-tools validate`) | PASS |
| wasip3 WIT imports | **`wasi:clocks/monotonic-clock@0.3.0`**, **`wasi:clocks/system-clock@0.3.0`** (real WASI 0.3) |
| wasip3 `wasmtime compile` | PASS (~14 ms) |
| wasip3 `wasmtime run` default | FAIL expected: no `wasi:cli/run` export (library component, not a CLI command) |
| Core twin Node multi-step pose vs JS `POSES` | **PASS** (`node run_core_equiv.mjs`) -- invalid scale 1.0374 ring 3; pressed 0.985 |
| Core twin `wasmtime run --invoke sm_go` | PASS (single-export invoke; fresh instance each CLI call) |
| Component-world invoke of `sm_*` under Wasmtime | **NOT TESTED** -- C ABI exports live on the embedded core module; they are **not lifted** into the component world. Need a WIT export world + binder. |

## Precise missing pieces for full WASI 0.3 host exercise

1. **WIT world** that exports `sm-go` / `sm-tick` / ... (or a richer `jr_*` subset).
2. **wit-bindgen** / **cargo-component** (or hand-written lifts) so those functions appear as component exports.
3. **Host program** (Wasmtime Rust embedding, or jco `preview3-shim`) that calls the WIT exports across multiple ticks in one instance.
4. Optional: proposed **WebGPU WIT world** -- does not exist in WASI; still a custom host binding even if WASI 0.3 is assumed for Matthew's users.

## Sizes (release)

| Artifact | Bytes | Module version word |
|---|---|---|
| sm_pose_core.wasm | 770 | `01 00 00 00` (core v1) |
| sm_pose_wasip2.wasm | 13958 | `0d 00 01 00` (component) |
| sm_pose_wasip3.wasm | 20902 | `0d 00 01 00` (component) |

## Honesty: ViewStates vs this spike

This spike mirrors the **ViewStates pose subset** (idle/hover/pressed/invalid + fixed edgeMs ease-out), not the full JMotion edge table / ambient / parallax.
