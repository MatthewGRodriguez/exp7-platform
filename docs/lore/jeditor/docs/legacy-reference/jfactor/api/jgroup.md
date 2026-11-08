# JGroup

← [API index](./README.md) · [Concepts](./concepts.md)

Decision set. Holds candidate actions/groups and runs the optimizer.

```js
const g = new JGroup()
g.Consider(action)
const ordered = g.Best()
```

---

## Constructor

```js
new JGroup()
```

---

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `jgroup` | `array` | `[]` | Children (`JAction` / nested `JGroup`) |
| `jatomic` | `boolean` | `false` | All-or-nothing vs unpack |
| `jreq` | `object \| null` | `null` | Prerequisite for this group |
| `name` | `string` | — | Label |
| `jmethod` | `function \| null` | — | Optional group-level scorer |
| `jatomicFail` | `boolean` | — | Set when atomic simulation fails |
| `jhash` | `Map` | — | Hash totals for regroup |
| `preRegroupOption` | `array` | — | Flat ordered result before interval regroup |
| `option` | `array` | — | Post-regroup execution array |

---

## Methods

### `Consider(jaction) → void`

Register a child. Copies `jreq` from the group onto the child when the child has none.

### `Best() → array`

Live optimization. Mutates resources. Returns ordered executed actions (possibly regrouped).

### `SimulatedBest(inheritedJoyMap?) → array`

Pure simulation against a cloned joyMap. Used by atomic groups and nested evaluation. Does not commit live Joys unless later committed via atomic success paths.

### `Validate(joption) → this | undefined`

Group-level `jreq` check against realized options.

### `JPreview() → array`

Preview helper (delegates into evaluation plumbing).

---

## Atomic failure

If `jatomic === true` and not all required children can run, the group scores as unrealizable (`jatomicFail`) and does not commit partial live mutations from that atomic fork.
