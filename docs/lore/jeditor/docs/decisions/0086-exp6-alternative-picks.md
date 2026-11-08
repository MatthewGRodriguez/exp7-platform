# ADR 0086: Alternatives are picked by Exp6 JGroup Best / SimulatedBest

Status: accepted (2026-11-01), M17b.

- Order of precedence: the user's pick, then `alts.pref`, then Exp6. Without the Exp6 globals, the prior argmax is used.
- Exp6: one `JGroup` per item with alternatives, and one `JAction` per available member. Its jmethod returns the member's blueprint score, with `Joy(1, Number.MIN_VALUE)` for jX/jY. `alts.method` 'best' calls `Best()` and 'sim' calls `SimulatedBest()`. The first entry of the returned order wins, so on a tie the first member wins, which matches the old argmax.
- The generated page embeds the Exp6 bundle (main thread + worker text) and jf_engine. The WebGPU > wasm-simd > wasm > js chain is unchanged: `JFEngine.detect()` is recorded in `JW.scoreBackend`. CSP adds 'wasm-unsafe-eval'.
- Verified: world_test parity runs 200 random alternative sets, including ties and unavailable members. Exp6 Best equals the prior argmax 200/200 and equals a direct `JGroup.Best()[0]` 200/200. SimulatedBest returns an available max-score member 200/200. A fixed case [-12,-30,-18] gives the order a,c,b.
