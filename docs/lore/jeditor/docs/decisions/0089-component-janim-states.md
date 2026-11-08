# ADR 0089: Components load animation sets from .janim.json, and states map from blueprint outputs

Status: accepted (2026-11-01), M17b.

- `view.janim` names an animation file from `/api/animations`. At build time its scopedCss is embedded, scoped to `.jw-comp[data-comp="id"]`.
- `view.states` maps a state name to {bg, border, sm, anim}.
- `Eval.stateNames(w, comp)` lists the then/else names of the condition nodes wired into that component's view `style` input. The editor offers exactly those names, so the state mapping always comes from blueprint outputs.
- Subcomponents are added by reference (`sub[].comp`). A position node (x, y, w, parent) places them through the view's `comps` input.
