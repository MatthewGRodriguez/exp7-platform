# Events & value methods

← [API index](./README.md) · [JBlueprint](./jblueprint.md)

Resource capacity changes on Blueprint-tagged Joys/Relations emit events. Handlers may be functions or declarative specs.

---

## Register

```js
bp.onChange('money', handlerOrSpec)
bp.onGain('money', handlerOrSpec)
bp.onSpend('energy', handlerOrSpec)
bp.when({ resource: 'monthDone', gte: 12, once: true, give: { happy: 5 } })
```

`handlerOrSpec`:

| Form | Behavior |
|------|----------|
| `function (ctx) {}` | Callback |
| `'fnName'` | `call` that named `.fn` |
| `{ ... }` | Declarative spec (+ optional `run: fn`) |

Re-entrancy depth capped (~8).

---

## Event context (`ctx`)

| Field | Type | Description |
|-------|------|-------------|
| `resource` / `name` | `string` | Resource that changed |
| `before`, `after`, `value` | `number` | Capacities |
| `delta` | `number` | `after - before` |
| `amount` | `number` | `abs(delta)` |
| `gain` / `spend` | `boolean` | Direction flags |
| `get(n)` | fn | Read capacity |
| `give(n, amt)` / `take(n, amt)` | fn | Mutate (may re-emit) |
| `call(fnName, extra?)` | fn | Invoke `.fn` |
| `apply(fnName, target?)` | fn | Add numeric return onto resource (silent) |
| `set(n, amtOrFn)` | fn | Absolute set via delta give |
| `norm`, `resources` | — | Helpers |

---

## Declarative spec keys

| Key | Description |
|-----|-------------|
| `call` | Named `.fn` or function |
| `apply` | Named `.fn` returning number → add to `target` or triggering resource (silent) |
| `target` | Resource name for `apply` |
| `give` | `{ resourceName: number \| fnName \| (ctx)=>number }` |
| `take` | Same shape as `give` |
| `set` | Absolute values |
| `run` | Extra callback (also set as `fn`) |

---

## `when` predicates

| Key | Fires when |
|-----|------------|
| `cross: t` | Crosses threshold `t` either direction |
| `eq: v` | Lands on `v` from a different value |
| `gte: v` | Crosses upward through `v` |
| `lte: v` | Crosses downward through `v` |
| (none) | Any change (≡ `onChange`) |
| `once: true` | Only the first successful fire |

---

## Value methods

```js
bp.fn('kickback', ({ amount }) => amount * 0.1)
bp.onGain('money', { give: { happy: 'kickback' } })

bp.fn('payday', (ctx) => { ctx.give('money', 500) })
bp.when({ resource: 'monthDone', gte: 1, call: 'payday' })

bp.call('kickback', 100) // → 10
```

---

## Silent grants

`give(..., { silent: true })` and `ctx.apply` / spec `apply` avoid infinite `onGain → give → onGain` loops on the same rule.
