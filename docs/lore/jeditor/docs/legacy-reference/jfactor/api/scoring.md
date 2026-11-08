# Scoring

← [API index](./README.md)

Built-in scorers and verification. Custom scorers: `JBlueprint.method` / `methodFrom`, or pass any `(x,y,X,Y,group) → number` to `JAction`.

---

## `JVerify(x, xmax) → number | boolean`

Capacity / polarity gate used by `JAction.Validate`.

Internal codes drive consume vs produce acceptance. Prefer treating `Validate` as the public check.

---

## `JDirect(x, y, xmax, ymax, jgroup) → number`

Same-direction pairs (both consume or both produce). Penalizes mixed polarity exchanges.

**Use when:** both sides move the same way (e.g. burn two consumables).

---

## `JIndirect(x, y, xmax, ymax, jgroup) → number`

Cross-direction exchange (consume one, produce the other). Rewards profitable transforms.

**Use when:** classic trade — time→money, energy→happy, money→skills.

Blueprint alias: `method: 'indirect'` (default).

---

## `JNeutral(x, y, xmax, ymax, jgroup) → number`

Soft / structural scoring when both sides produce (or neutral coupling).

Blueprint alias: `method: 'neutral'`.

---

## Blueprint helpers — `JBlueprint.norm`

| Helper | Signature | Description |
|--------|-----------|-------------|
| `clamp01(v)` | `number → number` | NaN→0, clamp to \[0,1\] |
| `unit(raw, scale?)` | → `[0,1]` | Soft saturation `\|raw\|/scale` |
| `layerAverage(scores)` | `number[] → number` | Mean of child scores |
| `layerMean(scores)` | alias | Same as `layerAverage` |
| `pair(x, y, X, Y)` | → `[0,1]` | Lightweight magnitude/capacity scorer |

```js
.method('bridge', ({ x, y, X, Y }) => JBlueprint.norm.pair(x, y, X, Y))
.methodFrom('softDirect', JDirect, 2)
```

---

## Group-level score

`layer(..., { score: (ctx) => number })` replaces the group's `jmethod`. `ctx` includes `j`, `option`, `group`, helpers (`get`, `call`, `norm`, …). Atomic fail short-circuits to `-Number.MAX_VALUE`.
