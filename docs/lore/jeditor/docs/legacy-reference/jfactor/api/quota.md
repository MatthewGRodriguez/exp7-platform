# Quota

← [API index](./README.md)

Hard numerical throttle on how many child actions may execute inside a (usually non-atomic) group.

```js
const q = new Quota()
q.Regulate(5, monthGroup)
q.Count(childAction) // or Count(childGroup)
```

---

## Constructor

```js
new Quota(jmax?, polarity?)
```

Behaves like a Joy tethered to mega-anchor actions.

---

## Methods

### `Regulate(amount, jgroup) → void`

Injects a high-priority action that gifts `amount` quota points into the pool for `jgroup`.

### `Count(jgroup) → void`

Appends a toll action so each execution of `jgroup` (or its children, depending on wiring) spends 1 quota point.

### `Limit(amount) → void`

Sets the quota ceiling.

### `Deduct(jgroup) → void`

Related deduction helper for custom wiring.

---

## Pattern notes

- Host group is typically **`jatomic = false`** so partial completion is allowed once the pool empties.
- Mega-anchors use extreme scores — do not reuse that pattern for ordinary ranked choices (float discrimination).
- Prefer Blueprint calendars / natural resource constraints when a soft ordering is enough; use Quota for hard “at most N picks” knapsacks.
