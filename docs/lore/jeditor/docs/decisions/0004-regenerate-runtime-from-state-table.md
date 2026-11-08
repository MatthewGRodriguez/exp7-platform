# ADR 0004: Regenerate the runtime from the state table
Status: decided (2026-10-30)
Decision: the shared animation runtime (minified JS + CSS, ADR 0001) is produced by a JEditor generator from the state table and params (state poses, `from>to` edge timing table, easings, parallax layers, ambient loops, lighting tokens), not ported from td.js as-is. Editing states or timings in the editor regenerates the runtime for the level.
Reference / parity target: the training day designer engine in docs/legacy-reference/tdd-animation/ (SM1b sm_logic.js + sm.css, states.py, params.json, PX2b). Its quality gates (07_qa: click path <= 120 ms, no idle rAF, ~0 idle recalcs, one animation per property, no-matchMedia, reduced motion, hidden-tab pause, contrast, perf p95) are used to check the generated output matches its motion.
Why: one source of truth that the editor can change; the TDD pipeline already works this way (gen_web.py emits sm.css/sm_logic.js from states.py).
See docs/design/02.
