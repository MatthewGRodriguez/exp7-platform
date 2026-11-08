# 0042 — Per-component and per-type motion overrides

Status: accepted (2026-10-31)

## Context
Motion (JMotion, ADR 0001/0004) was level-wide: one edge table, one enter, one ambient switch. M9 asks for overrides per component and per component type.

## Decision
- Data: `component.motion` and `level.motion.types[Type]`, each `{edges:{'from>to':[ms,easeIdx]}, enter:{ms,ease}|{off:true}, ambient:true|false, cue:{metric,op,value,name,mode}}`. Inheritance: level table < type < component (resolved at build time by `resolveMotion` in build_level.js; unknown edges are dropped).
- Runtime `builder/runtime/jmotion_over.js` (+ generated CSS `#jmotion-over-css`), inlined ONLY when at least one override exists — levels without overrides build byte-identically and motion parity still compares the untouched JMotion.
  - edges: renders are wrapped in `<!--jmo:id-->` markers; top-level elements get `data-jmo`; a MutationObserver on `data-sm` (JMotion's own handlers call a closure `go`, not a patchable global) re-sets `--sm-ms`/`--sm-ez` for transitions inside the component.
  - enter: `.jm-enter>[data-jmo=id]` animation duration/easing or `animation:none`.
  - ambient: component drifts with the ambient layer (still obeys the level ambient switch).
  - cue: `x.cue(el, name, mode)` with keyframes pulse/glow/shake; `once` fires on a false→true transition of the condition, `loop` fires on every render while it holds.
- Editor: Motion panel → "Component motion" for the selected component, scope "this component" / "all <Type>", steppers/cycles only, overridden values highlighted, empty objects pruned.

## Consequences / limits
- enter overrides only affect components that are direct children of a tab pane (that is where the enter animation runs); a part nested in RankCols/CalNavBar gets no visible enter change.
- Edge overrides apply to JMotion targets inside the component and are applied by the observer right after JMotion sets the state; the test checks the resulting `--sm-ms`, not the visual frame timing.
- Cue conditions use the level's metrics (`x.metric`), not arbitrary expressions.
