# JBlueprint

← [API index](./README.md) · [Events](./events.md) · [JWorld](./jworld.md) · [JGroup](./jgroup.md)

Declarative façade: named resources, scorers, layers → compiled plan.  
**After `build()`, the handle is a `JGroup`** (same idea as `JRelation` being usable as a Joy).

```js
const bp = JBlueprint.create()
  .resource('X', { start: 10 })
  .resource('Y', { start: 0 })
  .layer('Day', { atomic: true })
    .do('Work', { method: 'direct', from: 'X', to: 'Y', x: 2, y: -1 })
    .end()
  .build()

bp.run()                 // relation update → Best
bp.Best()                // JGroup API on the same members
bp.SimulatedBest()       // pure peek
outer.Consider(bp)       // nest like any group
```

All builder methods return `this` (fluent) unless noted.  
`build()` returns a **new** built handle (still `instanceof JBlueprint` / `JGroup`) that shares the authoring BP’s resource map — so one façade can `.build('Life')` and `.build('Budget')` as two planners.

---

## Factory

### `JBlueprint.create() → JBlueprint`

---

## Resources

### `resource(name, opts) → this` (register)

| `opts` | Description |
|--------|-------------|
| `start` | Initial `jmax` (default `0`) |
| `polarity` | `'-'` / `-Number.MIN_VALUE` = consume; else produce |
| `kind: 'joy'` / `scalar: true` | Force scalar `Joy` |
| `kind: 'relation'` / `gate: true` | Force token `JRelation` |
| `chain: true` | Relation instances auto-`jreq` |

**Default heuristic:** `start > 0` and not gate/relation → `Joy`; else empty gate relation.

### `resource(name) → Joy | JRelation` (lookup)

One argument → look up a registered resource (same as the old plan-bag `.resource(name)`).

### `get(name) → number`

### `give(name, amount?, opts?) → this`

`amount` default `1`. `opts.silent` skips event emit.

### `take(name, amount?) → this`

### `world() → JWorld`

`JWorld.fromBlueprint(this)` — shared resource Map identity.

---

## Scorers (action methods)

### `method(name, fn) → this`

`fn(ctx) → number`. `ctx`: `{ x, y, X, Y, group, amount, delta, norm, get, call, fn, give, take, resources, blueprint }`.

### `methodFrom(name, baseFn, scale?) → this`

Wraps `JDirect` / `JIndirect` / … through `norm.unit`.

Built-in names in `.do`: `'direct' | 'indirect' | 'neutral'`.

---

## Value methods

### `fn(name, handler) → this`

Named transforms for events / `call`. Not scorers.

### `call(name, partial?) → any`

`partial` number ≡ `{ amount }`. Builds an event-like ctx.

---

## Events

See [Events](./events.md).

| Method | Fires when |
|--------|------------|
| `onChange(resource, handlerOrSpec)` | Any capacity change |
| `onGain(resource, handlerOrSpec)` | Capacity increases |
| `onSpend(resource, handlerOrSpec)` | Capacity decreases |
| `when(spec)` | Threshold / cross |

---

## Layers

### `layer(name, opts?) → this`

| `opts` | Description |
|--------|-------------|
| `atomic` | `jatomic` on compiled group |
| `chain` | `JRelation` chain between repeats |
| `score` | Custom group scorer `(ctx) → number` |

Opens a layer stack frame. Last opened layer is default build root.

### `do(stepName, spec) → this`

| `spec` | Description |
|--------|-------------|
| `method` | Scorer name (default `'indirect'`) |
| `from` | Resource name → `jX` |
| `to` | Resource name → `jY` |
| `x`, `y` | Deltas |
| `after` | Same-layer step name → `jreq` |

### `include(layerName) → this`

Embed another layer’s compiled relation sequence.

### `repeat(n) → this`

Close layer; compile with `n` instances (`JRelation` count).

### `end() → this`

Close layer with count `1` (no repeat).

---

## Compile & run

### `build(rootName?) → JBlueprint` (built handle)

Throws if layers are still open. Returns a built handle that **is** a `JGroup`:

| Field / method | Description |
|----------------|-------------|
| *(JGroup)* | `Consider`, `Best`, `SimulatedBest`, `jgroup`, `jatomic`, … |
| `root` | Root `JRelation` |
| `resources` | Shared `Map` with the authoring BP |
| `blueprint` | Self-ref (same object) |
| `resource(name)` | Lookup Joy/Relation |
| `get` / `give` / `take` / `call` / `fn` | Proxied |
| `run()` | `root.update()` |
| `runAsync()` | `root.updateAsync()` |
| `considerBp(other)` | `Consider` another built BP / `JGroup` |
| `plan()` | Alternate bag handle (below) |

The built handle’s `jgroup` **shares identity** with `root.sequence.jgroup`.

### `plan() → PlanBag`

Alternate use case — same compiled BP as a plain object (no JGroup methods on the value):

| Field / method | Description |
|----------------|-------------|
| `blueprint` | Built `JBlueprint` |
| `resources` | `Map` |
| `root` | Root `JRelation` |
| `resource(name)` | Lookup |
| `get` / `give` / `take` / `call` / `fn` | Proxied |
| `run()` / `runAsync()` | Proxied |

Useful when you want a bag-shaped plan without treating the value as a nestable group.

---

## Static

### `JBlueprint.norm`

See [Scoring](./scoring.md).

---

## Tests

| File | Focus |
|------|--------|
| [`test_blueprint_as_jgroup.js`](../../test_blueprint_as_jgroup.js) | BP as JGroup + sequential Best/sim/run |
| [`test_blueprint_calendar.js`](../../test_blueprint_calendar.js) | Nested calendar spine |
| [`test_blueprint_resource_events.js`](../../test_blueprint_resource_events.js) | Events / fns |
| [`test_multiperspective.js`](../../test_multiperspective.js) | Multi `build()` + JWorld |
| [`test_dual_calendar_perspectives.js`](../../test_dual_calendar_perspectives.js) | Shared + private stocks |
