# JWorld

← [API index](./README.md) · [JBlueprint](./jblueprint.md)

Multi-perspective façade over **shared live resources**. Each perspective is a planner (`JRelation` or Blueprint plan `.root`).

```js
await JWorld.fromBlueprint(bp)
  .perspective('alice', alicePlan)
  .perspective('bob', bobPlan)
  .runAsync()
```

`Best()` stays single-threaded. Async only cooperatively interleaves `updateAsync` across perspectives.

---

## Factories

### `JWorld.create() → JWorld`

Empty world; register resources manually.

### `JWorld.fromBlueprint(bp) → JWorld`

Adopts `bp.resources` **by identity** (events keep working).

### `bp.world() → JWorld`

Alias for `fromBlueprint`.

---

## Resources

### `resource(name, joyOrOpts) → this`

Register. Accepts an existing Joy/Relation, or Blueprint-like opts (`start`, `polarity`, `gate`, `kind`, `chain`).

### `resource(name) → Joy | JRelation`

Lookup.

### `get(name) → number`

### `give(name, amount?) → this` / `take(name, amount?) → this`

If the resource is Blueprint-owned, delegates to `bp.give` (events fire).

---

## Perspectives

### `perspective(name, relationOrPlan) → this`

Register planner. Accepts:

- object with `update` + `updateAsync` (`JRelation`)
- Blueprint plan with `.root`

Registration order = `run()` order.

### `perspective(name) → JRelation`

Lookup.

---

## Run

### `run() → this`

Sequential: each perspective `update()` in registration order.

### `runAsync() → Promise<this>`

`Promise.all` of each perspective’s `updateAsync()`.

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `resources` | `Map<string, Joy\|JRelation>` | Shared stocks |
| `perspectives` | `Map` | `{ name, rel }` entries |
| `_order` | `string[]` | Registration order |
| `_blueprint` | `JBlueprint \| null` | Set when from Blueprint |

---

## Design notes

- Shared + private resources: same Map, different names — see `test_dual_calendar_perspectives.js`.
- Contested scarce shared stocks: prefer `run()` if ordering must be deterministic.
- Do not expect transactional isolation between perspectives under `runAsync`.
