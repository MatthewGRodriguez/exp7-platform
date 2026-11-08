# ADR 0021: Browser workers and WebGPU-first scoring come first
Status: decided (2026-10-30)
Decision (Matthew: "real browser workers and a WebGPU-first path first"): the first milestone of the JFactor core (M2a, before other engine work) builds:
- real browser workers;
- an async WebGPU-first scoring path.
JEditor will not ship only what the Exp6 bundle already runs correctly in a browser (where workers are Node-only and GPU is reached only through the warm cache; see ADR 0020).
Scope of the milestone: (a) browser worker runtime from inlined source via Blob URL, falling back to the main thread when blocked; (b) async scoring path, webgpu > wasm-simd > wasm > js; (c) cross-engine parity suite; (d) acceptance criteria + risk list.
Design details (proposal) are in docs/design/06 'M2a engine milestone'. Build order: docs/design/05.
