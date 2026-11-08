# 0029 — Calendar cash-after-bills ledger and condition engine (proposal layer on top of the original calendar)

Status: accepted as a **proposal** (M4, 2026-10-30). Implements ADRs 0012–0016. ADR 0025 still applies: there is no goals/margin metric.

## Decision
- The original `ranking_ui` has no per-day cash ledger. M4 adds one in `builder/packs/calendar_live.js` (`JCal.month`), labelled as a proposal:
  - **opening cash** = `cal.openingCash`. If unset, it is the sum of the "Cash on Hand" and "Checking" asset rows ([REDACTED-AMOUNT]).
  - **cash after bills(day)** = opening + Σ gains − Σ charges from `easyAmountOnDay` (the original rule) for every on-calendar act, days 1..day.
  - **headroom** = the minimum cash after bills from that day up to the next payday.
- **Condition engine** (`JCal.evaluate`): `{metric, op, value, severity, scope, on, anim}`.
  - Metrics come from the editable `jfactor.metrics` list: `cal.cashAfterBills`, `cal.headroom`, `cal.billsOut`, `cal.items`, `item.healthyFallbacks`, `item.amount`.
  - Scopes: day, week, month, range, item.
  - Combine modes: `severity` (default; bad > warning > n/a > good; every hit is kept) or `first`.
- **Defaults:**
  - cash after bills < [REDACTED-AMOUNT] → bad (pulse, loop);
  - cash after bills < [REDACTED-AMOUNT] → warning (pulse, once);
  - a decision item with fewer than 1 healthy fallback → bad.
- A "healthy fallback" is an alternative whose amount keeps the month's lowest cash ≥ 0 once it replaces the item. This is a proposal.
- **Animations** go through the shared runtime: `ctx.cue(el, name, 'once'|'loop')` in `jlevel.js`, with CSS keyframes pulse/glow/shake that use the jmotion `--sm-ms`/`--sm-ez` variables and respect reduced motion.
- **Board items** are JFactor items `{id, name, kind, amount, gain, alternatives, decision}`. The real data has no alternatives, so the no-fallback rule never fires on it.
- Money KPIs stay on the 'current' scenario, as in the original. The calendar's scenario pills only change the view.

## Consequences
- With the defaults and real data, nothing in October [REDACTED-AMOUNT] is highlighted: the lowest cash is [REDACTED-AMOUNT]. The highlight test raises the warning threshold to [REDACTED-AMOUNT] with the stepper, which highlights days 8–[REDACTED-AMOUNT].
- The ledger has no history of actual cash. It is a projection from today's sheet.
