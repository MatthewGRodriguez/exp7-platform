# JFactor API Reference

Resource optimization & hierarchical planning engine.

**Module:** [`JFactor.js`](../../JFactor.js)

```js
const {
  Joy, JAction, JGroup, JRelation, Quota,
  JDirect, JIndirect, JNeutral,
  JBlueprint, JWorld
} = require('./JFactor.js')
```

---

## How to use this in Cursor

1. Open any file under `docs/api/` and use **Markdown Preview** (`Cmd+Shift+V`).
2. Index the docs for `@Docs` / chat grounding:
   - **Cursor Settings → Indexing & Docs → Add Doc**
   - Point at this folder (`docs/api`) or the repo root.
3. Agents also load [`.cursor/rules/jfactor-api.mdc`](../../.cursor/rules/jfactor-api.mdc) when editing engine / tests.

---

## Preferred authoring path

| Layer | Use when |
|-------|----------|
| [`JBlueprint`](./jblueprint.md) + [`JWorld`](./jworld.md) | New plans, calendars, multi-perspective worlds, resource events |
| Raw [`Joy`](./joy.md) / [`JAction`](./jaction.md) / [`JGroup`](./jgroup.md) / [`JRelation`](./jrelation.md) | Low-level control, custom scoring |

---

## API index

| Symbol | Kind | Doc |
|--------|------|-----|
| [`Joy`](./joy.md) | class | Scalar resource (`jmax` + polarity) |
| [`JAction`](./jaction.md) | class | One resource transform |
| [`JGroup`](./jgroup.md) | class | Decision set; `Best()` / `SimulatedBest()` |
| [`JRelation`](./jrelation.md) | class | Blueprint → sequence; also usable as Joy |
| [`Quota`](./quota.md) | class | Hard execution-count throttle |
| [`JDirect`](./scoring.md#jdirect) / [`JIndirect`](./scoring.md#jindirect) / [`JNeutral`](./scoring.md#jneutral) | function | Built-in scorers |
| [`JVerify`](./scoring.md#jverify) | function | Capacity check helper |
| [`JBlueprint`](./jblueprint.md) | class | Declarative façade; after `build()` also a JGroup |
| [`JWorld`](./jworld.md) | class | Shared resources + multiple planners |
| [Events & `fn`](./events.md) | — | `onGain` / `onSpend` / `when` / value methods |
| [Concepts](./concepts.md) | — | Polarity, atomicity, inject, async |

---

## Quick start (Blueprint)

```js
const { JBlueprint } = require('./JFactor.js')

const bp = JBlueprint.create()
  .resource('energy', { start: 100, polarity: '-' })
  .resource('money', { start: 0 })
  .method('bridge', ({ x, y, X, Y }) => JBlueprint.norm.pair(x, y, X, Y))
  .layer('Day', { atomic: true })
    .do('Work', { method: 'bridge', from: 'energy', to: 'money', x: 10, y: -50 })
    .repeat(1)
  .build()

// Built handle is a JGroup (Best / SimulatedBest / Consider)
bp.run()
bp.Best()
console.log(bp.get('money'))

// Alternate bag use case (same compiled BP, no JGroup methods on the value)
const bag = bp.plan()
bag.run()
```

## Quick start (multi-perspective)

```js
const { JBlueprint, JWorld } = require('./JFactor.js')

const bp = JBlueprint.create()
  .resource('money', { start: 1000 })
  // … private resources + layers for alice / bob built separately …

const alice = /* alice calendar plan */
const bob = /* bob calendar plan */

await JWorld.fromBlueprint(bp)
  .perspective('alice', alice)
  .perspective('bob', bob)
  .runAsync()
```

See [`test_dual_calendar_perspectives.js`](../../test_dual_calendar_perspectives.js).

---

## Canonical tests

| Concern | Test |
|---------|------|
| Blueprint as JGroup | `test_blueprint_as_jgroup.js` |
| Blueprint calendar | `test_blueprint_calendar.js` |
| Resource events | `test_blueprint_resource_events.js` |
| Multi-perspective | `test_multiperspective.js` |
| Dual calendars (shared + private) | `test_dual_calendar_perspectives.js` |
| Cooperative async update | `test_parallel_update.js` |
| Inject / orphan / rollback | `test_exp2_*.js` |
| Parallel Best (not shipping) | `test_exp3_parallel_best.js` |
