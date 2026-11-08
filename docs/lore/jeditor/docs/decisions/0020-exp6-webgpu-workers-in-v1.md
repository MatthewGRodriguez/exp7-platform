# ADR 0020: Exp6 WebGPU and worker runtimes in v1
Status: decided (2026-10-30). Extends ADR 0018.
Decision (Matthew: "include the webgpu and worker runtimes too"): v1 levels embed the whole spliced Exp6 bundle: plain JS, WASM/SIMD, WebGPU and workers. Target fallback chain: webgpu > wasm-simd > wasm > js, with workers where available. A level setting sets the engine preference, and results report which engine ran.
Facts read (legacy/legacy/html/vendor/JFactor_exp6.js, 166,029 B, read-only):
- All runtimes are already inside the one bundle (spliced by tools/splice_exp6_opts.js). Approximate section sizes are simd+WASM base64 ~12.7 KB (L658-953), GPU ~8.0 KB (L956-1187) and workers ~7.3 KB (L1190-1391). Including them costs nothing extra beyond the bundle.
- WebGPU (`JFExp6GPU`): the WGSL shader is an inline string. `init()` runs `navigator.gpu.requestAdapter` → `requestDevice` → `createShaderModule` → `createComputePipeline` and auto-starts when `navigator.gpu` exists. On failure it warns and is not ready. It is async; `scoreSync` returns cached GPU scores only when the same rows were already warmed (`warmScoreAsync`), else `scoreCpu`. No external file is needed, so it is single-file OK.
- Workers (`JFExp6Workers`): `tryInitPool` is Node-only (`require('worker_threads')`, loads `tools/exp6_score_worker.js` from disk, up to 4 workers, backend 'worker_threads'). In a browser it reports backend 'sync'. `scoreBatchParallel` (sync) only chunks on the main thread. No browser `Worker`, no Blob URL / createObjectURL in the bundle.
- Current dispatch (`jfBatchScore`): WASM/SIMD first when n >= 8 (and warms GPU when n >= 64), then workers when n >= 256, then GPU sync (cache) when n >= 64, then JS. The bundle's order is not the decided webgpu-first chain.
Risks:
1. Single-file workers: real browser workers need new code: a Blob-URL worker built from inlined worker source (proposal). It may also be blocked by CSP or by file:// rules in some browsers, and falls back to the main thread (backend 'sync').
2. WebGPU is async-only. webgpu-first sync scoring would get cached results only after warm-up. JEditor needs an async scoring path or accepts the first-call fallback. Changing the dispatch order means wrapping/patching the bundle; parity tests will be required across backends.
3. WebGPU availability varies by browser/OS and needs a secure context (https or localhost; file:// may not expose it). Fallback covers it.
4. Float32 on GPU/SIMD vs float64 in JS: parity within an epsilon, not exactly.
