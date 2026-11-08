# Concepts

← [API index](./README.md)

---

## Resource polarity

Every `Joy` / `JRelation` has a polarity:

| Polarity | Constant | Meaning | Action deltas |
|----------|----------|---------|---------------|
| Consumed | `-Number.MIN_VALUE` or Blueprint `polarity: '-'` | Stock drained by use | Positive `x`/`y` typically spends |
| Produced | `Number.MIN_VALUE` (default) | Stock grown by production | **Negative** `x`/`y` increases `jmax` |

Production example (earn money):

```js
new JAction(JIndirect, null, 10, -50, energy, money)
// spend 10 energy, mint 50 money
```

---

## Atomic vs non-atomic groups

| `jatomic` | Behavior |
|-----------|----------|
| `true` | All-or-nothing. Group identity stays in `option[]` (safe `jreq` target). |
| `false` | Children unpack into the pending pool; group wrapper may disappear (unsafe as `jreq` target). |

**Rule:** If something later `jreq`s a group, that group must be atomic.

---

## Execution model

1. `JGroup.Best()` / `SimulatedBest()` — single-threaded combinatorial pick.
2. `JRelation.update([jmax])` — grow/shrink sequence, then `Best()` on `sequence`.
3. `JRelation.updateAsync([jmax])` — same, but yields between steps so multiple planners can cooperatively interleave.
4. `JWorld.run()` — sequential `update()` per perspective.
5. `JWorld.runAsync()` — `Promise.all` of `updateAsync()` on shared resources.

**Not implemented:** parallelizing the inner `Best()` loop (Exp3 shelved — overhead > gain).

---

## Inject & dynamic relations

Actions that touch a `JRelation` Joy may call `updateInject`, spawning units into the live find queue within the current `Best()` pass (when the inject gate allows).

Default relation options: **no auto `jreq` chain** unless `{ chain: true }`.

Nested atomic groups fork a joyMap for simulated purity; failed atomics roll back without poisoning siblings.

---

## Shared resources (multi-perspective)

Perspectives share the **same** resource Map (Blueprint identity preserved so events still fire).

- Private stocks: separate named resources (`a_energy`, `b_energy`).
- Shared stocks: one name both planners read/write (`money`).
- `runAsync` is cooperative interleave, not transactional isolation across perspectives. Contested scarce stocks may need `run()` (ordered) semantics.

---

## Scoring band

Prefer scorers that return comparable magnitudes (Blueprint `norm.*` targets ~0–1). Extreme `Number.MAX_VALUE` anchors exist for Quota mega-anchors but destroy float discrimination if overused on ranked choices.
