# ADR 0082: Components are world records with a view; sub-components by reference

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- Component record: `{id, name, view:{layout:"stack"|"row"|"grid", theme:{tokens}, item:{show:[fields]}, states:{<name>:{bg, fg, border, sm:<JMotion state>, anim:"none"|"pulse"|"shake"|"glow"}}}, items:[refs], blueprints:[refs], state:{}, sub:[{comp:ref, pos:{x,y,w}}]}`.
- **A component stands on its own.** The view holds all theme information: how items are styled, parts, animations and positioning.
  - A per-item state name, written by a blueprint, selects a `states` entry. Its `sm` sets the item's JMotion state (`data-sm`, using the shared animation runtime `builder/janim.js` with `animations/default.janim.json`), and its `anim` adds a keyframe animation.
- **A sub-component** is an ordinary component grouped under a parent so that it uses the parent's view and positioning.
  - It is shared **by reference**.
  - It may be placed differently under different parents: the position lives in the parent's `sub` entry, or in `state.pos[parent]` when it was written by a position node.
- **No forced nesting.** `world.root` lists the top-level components. Tabs are just an ordinary component.
- Supersedes ADR 0003, 0044 and 0045 (the requirement that components live in Tabs), and 0065–0077 (component structure), for new work.
