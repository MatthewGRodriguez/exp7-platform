# JRelation

← [API index](./README.md) · [Concepts](./concepts.md)

Blueprint → sequence of instances. Also acts as a Joy (`jmax` / polarity) so calendars and token banks can be consumed or grown by actions.

```js
const year = new JRelation(monthBlueprint, 12, Number.MIN_VALUE)
year.update()
```

---

## Constructor

```js
new JRelation(blueprint, count, polarity, options?)
```

| Param | Type | Description |
|-------|------|-------------|
| `blueprint` | `JGroup` | Template cloned per instance |
| `count` | `number` | Initial number of instances |
| `polarity` | `number` | Same as `Joy` |
| `options` | `object` | `{ chain?: boolean }` — if `chain: true`, instance *n* `jreq`s instance *n−1*. **Default: no auto-chain.** |

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `blueprint` | `JGroup` | Source template |
| `sequence` | `JGroup` | Live container of instances |
| `polarity` | `number` | Joy polarity |
| `_jmax` / `jmax` | `number` | Instance count (Joy-compatible) |
| `chain` | `boolean` | Auto `jreq` between successive units |

---

## Methods

### `instance() → JGroup | JAction`

Deep-clone one blueprint unit (preserves `jatomic`, remaps internal `jreq`s).

### `update(jmax?) → this`

Resize toward `jmax` if provided (grow or shrink), then `sequence.Best()`.

### `updateAsync(jmax?) → Promise<this>`

Like `update`, but `await Promise.resolve()` between instance steps and before `Best()`, enabling cooperative multi-planner interleave. **`Best()` itself stays synchronous.**

### `updateInject(jmax, findQueue, prepareFunc, buyerForJreq) → void`

Dynamic grow/shrink during an active `Best()` pass. New units can be pushed into `findQueue`. Optional `buyerForJreq` ties new units to the purchasing action when not chaining.

### `valueof() → number`

Joy-compatible numeric value.

---

## As a resource

```js
// Spend money to add vacation days (relation as jY)
new JAction(JIndirect, null, 200, -1, money, vacationRel)
```

Blueprint form: `.resource('days', { gate: true })` or `{ kind: 'relation', start: 0 }`.
