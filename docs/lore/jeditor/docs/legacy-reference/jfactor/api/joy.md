# Joy

← [API index](./README.md) · [Concepts](./concepts.md)

Scalar resource: capacity `jmax` + polarity.

```js
new Joy(jmax, polarity)
```

---

## Constructor

| Param | Type | Description |
|-------|------|-------------|
| `jmax` | `number` | Current capacity / stock |
| `polarity` | `number` | `-Number.MIN_VALUE` (consume) or `Number.MIN_VALUE` (produce) |

Throws if polarity is not one of the two allowed values.

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `jmax` | `number` | Live capacity. Mutated by executed actions / `give` / `take`. |
| `polarity` | `number` | Consume vs produce semantics for `JVerify` / scoring |

---

## Notes

- Prefer `JBlueprint.resource(name, opts)` for named resources (events + `get`/`give`).
- Token banks / gates that grow as discrete units use `JRelation`, not `Joy` (Blueprint `gate: true` or `kind: 'relation'`).
- Blueprint-tagged Joys carry `__bpName` / `__bpOwner` so capacity changes emit events.
