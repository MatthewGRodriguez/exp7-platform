# ADR 0016: Conditions can trigger animations
Status: decided (2026-10-30)
Decision (Matthew: "yes"): a calendar highlight condition can trigger an animation, not only a static highlight style. The condition's `animation` refers to presets/states of the shared runtime (ADR 0001/0004) with the standard edits.
Constraints (TDD reference): one running animation per property per element; no per-element loops restarted on re-render; no idle rAF; reduced motion off; hidden-tab pause.
See docs/design/06.
