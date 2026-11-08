# ADR 0081: Blueprints are world records; the seven node types; the view node

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- Blueprint record: `{id, name, nodes:[{id, type, p:{settings}, x, y}], wires:[{from:[node,port], to:[node,port]}]}`.
- A blueprint never attaches to anything. Items reference the one they are scored with, and components list the blueprints they use **by reference**. There are no private blueprints.
- Inputs come only from world items and joys. Component state is world data too, so it can be read as well.
- **Node types** (`world/eval.js NODES`):
  - **item** `{item:ref|"event", field}`
    - outputs `value` and `ref`;
    - inputs `set` (writes `values[field]`), `add` (delta) and `state` (writes `state[field]`).
  - **joy** `{joy}`
    - output `value`;
    - inputs `add` (delta) and `set`.
  - **math** `{op: const|add|sub|mul|div|min|max|neg|clamp01, value}`
    - inputs `a`, `b`; output `out`.
  - **condition** `{op: > >= < <= == != | event, value, then, else, event}`
    - input `a`;
    - outputs `ok` (1/0) and `state` (`then` or `else`, a state name);
    - with `op:"event"` it reads the view's event stream: `ok` = an event of that type is active, and `item` = that event's item.
  - **component** `{comp}`
    - output `comp`.
  - **position** `{x, y, w, parent}`
    - input `comp`; output `placed`.
    - The position is stored per parent in the component's state, `state.pos[parent]`.
  - **view** `{comp}`
    - inputs `items`, `comps` (accepts placed components), `style` (state name, applied to the item on `item`, otherwise to the component) and `item`;
    - **output 1 `changed`**: the items and components whose state changed in the last pass;
    - **output 2 `events`**: the active event streams (click, drag, drop, select).
  - **score** (outputs of the blueprint): the score is the `a` input of a math node with `p.out:"score"`, and a conditional jreq is `p.out:"jreq"`. These are math or item nodes marked as blueprint outputs; they are not an eighth type.
- **Wiring order:** a component node's output passes through a position node before it reaches a view input.
- **Blueprint outputs drive the view.** Conditions produce state names, and the view node writes them into the component's state (`state.styles[item]` or `state.style`). The view's theme maps a state name to theme parts and animation (ADR 0082).
- **User actions go through a blueprint:** page event, then the `events` output, then a condition (`op:event`), then a write node. A view never writes items directly.
- **Within one blueprint, wires must not form a cycle.** Loops between blueprints, or a blueprint that writes what it reads, are allowed (ADR 0084).
- Supersedes ADR 0048/0053/0058 node sets for new work. jbp stays for legacy levels.
