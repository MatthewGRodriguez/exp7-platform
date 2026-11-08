# ADR 0058 — Calendar conditions are blueprints (M14)

Status: accepted (2026-10-31)

Conditions are now `kind: 'condition'` blueprints in `data.blueprints`. They are no longer hard-wired `state.values.cal.conditions` records.

- **Nodes.**
  - `cond.measure` takes a metric that must be in `level.jfactor.metrics` (validated).
  - `data.const`, `joy.value` and `out.ref` supply thresholds.
  - `cond.cmp` takes op `< <= > >= =`.
  - `cond.and`, `cond.or` and `cond.not` combine tests.
  - The sink is `out.condition {severity bad|warning|n/a|good, scope day|week|month|range|item, anim null|{name, mode once|loop}}`.
  - Combine mode stays `cal.combine`, which is a view setting.
- **Runtime** (`jdata.condSync`, called in the render wrapper before every component render). It compiles blueprints into the records that `JCal.evaluate` and the Plan's `evalPath` already consume.
  - The simple shape (measure → compare(const) → out) compiles to the identical v1 record, so rendering is byte/pixel-equal.
  - Any other graph compiles to a synthetic metric `bp:<id>` registered in `JCal.METRICS` (`=1`). Plan paths therefore evaluate the same blueprints.
- **In-page edits** (CalendarBoard condition table) are detected by signature. `cal.condSig` persists the last compiled signature, so a reload never mistakes stale records for an edit. The edited records are folded back into blueprints (`cal.condBps`). Older saved state carrying edited records (stateVersion 1) gets the same treatment.
  - Known limitation: `condBps` lives in memory and is re-derived from the persisted records on each load; it is not itself written to localStorage until the next state save.
  - Page edits override level defaults for that browser.
- **Defaults shipped as blueprints:** `cash_neg` (<[REDACTED-AMOUNT] bad, pulse loop), `cash_low` (<[REDACTED-AMOUNT] warning, pulse once), `no_fallback` (item.healthyFallbacks <1 bad, item scope).
- **Editor.**
  - "+ condition" builds a blueprint with pickers: measure → test → threshold → severity.
  - Graph pickers cover metric, op, severity, scope and anim (none / pulse|shake|glow × once|loop).
  - Undo/redo and persistent history apply as for every blueprint edit.
