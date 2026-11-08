# ADR 0001: Single animation runtime
Status: decided (2026-10-30)
Decision: all motion goes through one shared runtime (`jmotion`), inlined once into every level. Quality bar and base design: the training day designer's CSS+JS state-machine engine (SM1b `data-sm` + edge timing table, PX2b parallax), not custom elements/shadow DOM. TDD hand-typing size limits do not apply. Components reference presets; the editor exposes standard edits (duration, delay, easing, trigger, property, stagger, loop, reduced-motion fallback).
Why: the three apps use three different motion approaches and detail levels; one runtime gives consistent quality.
Format (decided 2026-10-30): minified JS + CSS, not WebAssembly. Matthew: use whatever is most optimal for the editor, since the output is one HTML file. The engine is DOM/CSS-driven (state attribute + CSS transitions), so JS+CSS is the natural fit.
How it is built: see ADR 0004 (regenerated from the state table). See docs/design/02.
