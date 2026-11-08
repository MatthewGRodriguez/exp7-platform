# v13 independent QA: static checks + CPU harness reruns (updated 2026-11-06 ~23:10 CST)
Delivered files are unchanged: I wrote nothing in deliver/exp7-demo/ or motion-v13/.
Scratch copy is in run/. `diff` shows its .mjs/.py files are byte-identical to motion-v13/; I made NO harness edits.

## createRequire handling
cpu_app_preflight.mjs line 3: createRequire('/Users/[REDACTED-USER]/Home/Dev/JEditor/wasi03_eval/loader/package.json') then req('linkedom').
That path does not exist on the box. The require still resolves because Node's CJS resolver checks NODE_PATH global folders after the (missing) node_modules chain.
I installed linkedom with npm into deps/node_modules and ran with NODE_PATH=$PWD/../deps/node_modules.
Control run: the same command without NODE_PATH exits 1.
Only cpu_app_preflight.mjs contains the Mac path. slab_tests, motion_tests and original_public_regressions import it, so they inherit the dependency. build.mjs, original_artist_node_tests.mjs and all .py files contain no Mac path.

## Integrity
- v13 sha256 429a745d...75ec7: PASS.
- v11 exp7-demo.html == exp7-demo.v11.html == motion-v13/accepted-v11.html (fe1fec71...): PASS.
- Evidence copies of v12/v13 match deliver/: PASS.
- SOURCE_SHA256.json: 36/36 match after remapping the motion_v13/ prefix.
- v12 script bodies in v13: 18/18 verbatim. The single new script is #17 (EXP7_SLAB_CONFIG + ambient, 14716 chars).
- v11 script bodies in v13: 15/16 verbatim. The one v11 script that is not verbatim was not further analyzed.
- I did NOT separately byte-check wasm/core payload bytes. "Original core" means only that those script bodies are carried over verbatim, plus the harness label.

## CPU reruns (Node v20.19.2, linkedom DOM shim)
- cpu_app_preflight, default env (MOTION_ALLOWED unset, so matchMedia matches=true = REDUCED motion): PASS 20 (cpu_app_reduced_default.log)
- cpu_app_preflight, MOTION_ALLOWED=1 (motion allowed): PASS 20 (cpu_app_allowed.log)
- cpu_app_preflight, MOTION_NO_MATCHMEDIA=1 (matchMedia deleted): PASS 20 (cpu_app_no_matchmedia.log)
  Caveat: once timings are stripped, all three logs are identical. The output does not say which mode ran or show mode-specific assertions, so a mode-specific pass is inferred only from the env switch plus exit 0.
- slab_tests: PASS 76, 10000 samples, mean 0.174 ms (default env)
- motion_tests: PASS 140
- original_public_regressions: PASS 14
- projection_checks.py: PASS 16
- original_artist_node_tests: BLOCKED. It needs ../web/exp7/jrender.js from the repo; I did not inspect the repo.
- Correction: my first pass labeled the default run "allowed". It was actually reduced-motion.

## Not proof / still needed
CPU timings are not frame, pixel, GPU, memory or p95 evidence. Still untested:
- real-GPU verify('vf-cal') and device loss
- frame p95, idle and memory compared against v11 on the same workload
- whether ambient motion triggers front-text redraw (needs paint profiling)
- live browser UX: IME, touch, all 10 tabs, hit-testing during live parallax
- the repo artist tests
