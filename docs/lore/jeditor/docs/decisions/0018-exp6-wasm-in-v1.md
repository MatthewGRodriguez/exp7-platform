# ADR 0018: Exp6 WASM/SIMD kernels in v1
Status: decided (2026-10-30)
Decision (Matthew: "use the web assy too"): v1 levels embed the Exp6 WASM/SIMD kernels alongside plain-JS Exp6. Plain JS is the fallback when WebAssembly or SIMD is unavailable or init fails.
Clarifies ADR 0001: 0001 ("JS+CSS") covers only the shared animation runtime. The Exp6 engine is a separate embedded block (`<script id="jfactor">`) and may contain base64 WASM.
Facts read (The Joy Machine 2, read-only):
- Source `tools/exp6_kernels.wat` (12,069 B) exports memory, score_one, score_batch_soa, field_best and simd_sum_f32. It builds to `tools/exp6_kernels.wasm` (1,551 B) via `tools/build_exp6_wasm.js` (wabt, `features {simd:true}`), which also writes base64 `tools/exp6_kernels_b64.js` (2,170 B file).
- `tools/splice_exp6_opts.js` inlines the base64 as `var WASM_B64 = "..."` into JFactor_exp6.js with the simd, GPU and workers runtimes. The shipped `legacy/legacy/html/vendor/JFactor_exp6.js` (166,029 B, same size as living-core/vendor/exp6 copy) already contains it (L664).
- Load (`exp6_simd_runtime.js` `ensureWasm`): base64 → bytes (atob/Buffer) → `new WebAssembly.Module` + `Instance` (sync, no fetch). It probes SIMD with `simd_sum_f32`, and on failure it warns and stays not ready. Backends report 'wasm-simd' | 'wasm' | 'js'.
Consequence: single-file HTML works as is (no external .wasm). JEditor inlines the spliced bundle. A WebGPU/workers runtime is spliced in too; whether v1 enables it is open (doc 06). A parity test runs JS vs WASM results.
