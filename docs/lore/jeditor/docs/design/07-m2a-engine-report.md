# 07 — M2a engine report (2026-10-30)

Implements doc 06 "M2a engine milestone" (ADR 0018, 0020, 0021).

## What was built (`engine/`)
| file | purpose |
|---|---|
| `vendor/JFactor_exp6.js` | Read-only copy of the Exp6 bundle. md5 `d1ab03b3d5e3d1f8e087fad1db1df3e7`, 166,029 B. Originals untouched. |
| `vendor/MD5.md` | Records where the bundle came from and its md5 |
| `src/jf_engine.js` | `JFEngine`: `init`, `detect`, `scoreAsync(rows,{prefer,gpuMinRows:64,workers,workerMinRows:256})` → `{scores:Float64Array, backend, workers, ms, tried}`. Also `scoreWith`, `workersReady`, `pack`/`unpack`. |
| `src/parity_core.js` | The shared parity suite: fixtures, tolerances, comparison and best-item agreement |
| `test/real_fixture.js` | Builds 127 rows from numeric leaves of `data/ranking_ui/actuals_local.json`. The mapping exists only for testing and is not a scoring model. |
| `test/node_parity.js` | Headless pass/fail report for js, wasm and wasm-simd. Also checks `scoreAsync` and the unchanged sync path. |
| `build_parity.js` → `parity.html` | Builds a single self-contained test page (about 363 KB) with the bundle, engine, suite and real rows inlined |
| `test/chrome_headless.js` | Runs `parity.html` in headless Chrome. Uses a temporary profile, opens no window, and connects over CDP. |

Design notes:
- **Chain:** webgpu > wasm-simd > wasm > js. `prefer` picks the starting point and fallback continues down the chain. Webgpu is skipped below `gpuMinRows` unless `prefer:'webgpu'` is set.
- **GPU init:** has a 4 s timeout and falls back if it expires.
- **Workers:**
  - Built from a Blob URL. The source is the inlined bundle text (`<script type="text/plain" id="jfactor-worker">`) plus glue code.
  - Data moves as Float64Array with 7 columns, sent as transferables. SharedArrayBuffer is not used.
  - At startup, each worker runs a 3-row self-test against main-thread JS (3 s timeout). If the test fails, scoring runs on the main thread (`workers:'sync'`) and the reason goes into `tried`.
  - Workers are used for CPU backends when n ≥ 256. WebGPU runs on the main thread.
- **WASM below 8 rows:** the bundle uses WASM only when n ≥ 8, so smaller batches are padded with skip rows and the result is sliced back.
- **WebGPU output:** results are f32 and get widened to f64. Skipped rows are mapped to `-Number.MAX_VALUE` so they match JS.
- **Bundle not patched:** sync `jfBatchScore`, `JGroup.Best` and `SimulatedBest` are unchanged.

## How to run
```
cd engine
node test/node_parity.js        # headless js/wasm/wasm-simd, exit code 0/1
node build_parity.js            # regenerate parity.html
node test/chrome_headless.js    # headless Chrome run of parity.html (macOS Chrome path; CHROME=... to override)
open parity.html                # manual: any browser, read the table/summary
```

## Results (Matthew's Mac, 2026-10-30 ~21:05 CDT)

**Node v24.13.0: PASS.**
- detect: webgpu false, wasm-simd true, wasm true.
- Across all 6 cases, js, wasm and wasm-simd had max relative error 0 and the same best item.
- `scoreAsync` falls back correctly, with workers reported as 'sync' because Node has no Blob workers.
- The sync `jfBatchScore` result is unchanged.

**Headless Chrome 155 (`--enable-unsafe-webgpu`, temporary profile): PASS.**
- detect: all four engines available. The worker self-test passed with 4 workers.
- WebGPU max relative error was 4e-8 to 2.8e-7, within the 1e-5 tolerance, and the best item agreed in all 6 cases.
- On workers, wasm-simd and js over 20,000 rows had max error 0.
- `scoreAsync` results: auto → webgpu/sync; webgpu → webgpu; wasm-simd, wasm and js → each ran on workers.
- Timings for 20,000 rows:

  | engine | time |
  |---|---|
  | js | 1.1 ms |
  | wasm-simd | 0.8 ms |
  | webgpu | 4.1 ms (first call is about 24 ms) |
  | workers, wasm-simd | 6–7 ms (includes transfer cost) |

  These are single runs and are not benchmarks.

## Not verified
- **Safari:** not run.
- **Headed Chrome:** not run. WebGPU was only tested in headless Chrome with the `--enable-unsafe-webgpu` flag; the default flags were not tested.
- **Firefox:** not run.
- **Worker fallback path in a browser:** not exercised, meaning a self-test failure or a CSP that blocks blob: URLs. It is covered by code only.
- **WebGPU failure after init:** not exercised beyond the code path, for example device loss.
- **`file://` vs served over http:** only `file://` was tested.
- **Wiring:** `scoreAsync` is not wired into the editor or any saved level yet; that is M2b.

## Risks hit
- Headless `--dump-dom` with `--virtual-time-budget` stalled on WebGPU init and fast-forwarded the worker timeouts. I switched to CDP polling in real time and added a GPU init timeout.
- "wasm" and "wasm-simd" are the same f64 module in this bundle, and the label comes only from the SIMD probe. Both use the 1e-12 tolerance because their output is f64. Only WebGPU is 32-bit.
- The "real data" fixture is a synthetic mapping of real numbers to rows. It is not ranking_ui's scoring model.
- WebGPU computes in f32. Inputs larger than about 1.6e7 lose integer precision. The tests passed, but large money values could make close best-item picks flip, so the parity check stays important.
