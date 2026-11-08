# Motion v12 checkpoint
Scope: pt1644u original core-wasm+browser-JS Exp7 motion only. WASI migration closed. Accepted v11 unchanged; do not cut over automatically.

Authoritative source: Mac f4fcd018-5ea1-4447-9f5b-f95e55108969, /Users/[REDACTED-USER]/Home/Dev/JRender/motion_v12. Source commit is in REVISION.json. JEditor Lore111/remote100 unchanged. Machine-only source dependency exception already investigated/approved; no forge/remotes/new repositories.

Read COVERAGE.md first: edge/lifecycle integration working, original geometry absent for visible ambient/parallax; adapters only, do not claim completion or GPU pass. Engine states/transition source and limits in STATE_EDGES.md/mmd and motion-config.json. Accepted POSES preserved (art-study poses differ); source light/perspective studies reused as provenance, not candidate visual proof.

Tests178172/PID74837 completed0 in4.858s (140 targeted +20 app in reduced,allowed,missing matchMedia). Original public CPU test178173/PID75163 completed0 in7.316s (14 groups including400patch/500hit rounds). All observed; activeJobs=[]; do not rerun for lack of reporting. Development motion_failure.json is earlier deliberately diagnosed shake endpoint assertion, untracked/not delivered; final report has140 pass. Exact reports all bind candidate SHA b98f16510a27bdb78faa8cad357164f8c8f56ad3fe07b63af659ae87ea358a21.

To rebuild: cd motion_v12 && node build.mjs. Tests: node motion_tests.mjs; MOTION_ALLOWED=1 node cpu_app_preflight.mjs; MOTION_NO_MATCHMEDIA=1 node cpu_app_preflight.mjs; node original_public_regressions.mjs. Each writes its primary report; preserve named mode reports before reruns. LinkeDOM is an existing test-only dependency at JEditor/wasi03_eval/loader/package.json; no WASI/Boa execution. No shell browser automation; parent computerUse does actual GPU QA.

Delivery: /workspace/deliver/exp7-demo/exp7-demo-motion-v12-candidate.html; evidence/source archive under /workspace/deliver/jrender-exp7/motion-v12/. Accepted SHA fe1fec7197f8d8f01881385629be91d0389b25c53e0490a49bb6942f7405bc05. Other experiments must retain hashes recorded in DELIVERY.json.

Next: desktop hardware QA; original depth geometry mapping/design decision if ambient/parallax must be visibly added. Do not invent slabs/backgrounds or alter Exp7 selection/risk/model algorithms.
