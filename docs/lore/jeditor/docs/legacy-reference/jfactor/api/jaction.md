# JAction

← [API index](./README.md) · [Scoring](./scoring.md)

One decision that transforms two resources.

```js
new JAction(jmethod, req, x, y, jX, jY)
```

---

## Constructor

| Param | Type | Description |
|-------|------|-------------|
| `jmethod` | `function` | Scorer `(x, y, xmax, ymax, jgroup) → number` — e.g. `JIndirect` |
| `req` | `JAction \| JGroup \| null` | Prerequisite (`jreq`); must already be realized |
| `x` | `number` | Delta applied to `jX` (sign + polarity rules — see [Concepts](./concepts.md)) |
| `y` | `number` | Delta applied to `jY` |
| `jX` | `Joy \| JRelation` | First resource |
| `jY` | `Joy \| JRelation` | Second resource |

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `jmethod` | `function` | Scoring function |
| `jreq` | `object \| null` | Prerequisite reference |
| `x`, `y` | `number` | Resource deltas |
| `jX`, `jY` | resource | Bound Joys / Relations |
| `name` | `string` | Optional label (set by Blueprint `.do`) |
| `j` | `number` | Last computed score |
| `hash` | — | Identity for regroup / interval bucketing |

---

## Methods

### `Validate(joption) → this | false`

Returns `this` if `jreq` is satisfied (or null) and both resource sides pass `JVerify`; otherwise `false`.

---

## Blueprint equivalent

```js
.do('Work', {
  method: 'indirect',   // or registered .method name
  from: 'energy',
  to: 'money',
  x: 10,
  y: -50,
  after: 'Sleep'        // optional jreq by step name in same layer
})
```

See [JBlueprint](./jblueprint.md).
