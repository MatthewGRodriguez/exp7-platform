# ADR 0079: An item is a jgroup

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- Item record: `{id, name, values:{k:v}, factors:{<joyId>:weight}, state:{}, alts:null|{members:[item refs], pref:ref|null, unavail:[refs], method:"best"|"sim"}, jreq:null|ref, blueprint:null|"bp:<id>"}`.
- **There is no type field.** The joys an item uses (its `factors`) decide what it acts as. Grouping items by shared joys is not in the first build.
- **Alternatives** are a jgroup of references to other world items. This is the same system as ranking_ui, including Pref and Unavail. One item may be an alternative under several parents.
- **The pick** is stored as item state, `state.pick`:
  - a user pick (`state.userPick`) wins if that member is available;
  - otherwise Pref wins if it is available;
  - otherwise the available member with the highest blueprint score (each member's own `blueprint` score output) wins.
  - With `method:"best"` the pick is committed into `state.pick`. With `method:"sim"` it is only previewed in `state.simPick`, following Exp6's Best / SimulatedBest split.
  - A user pick of an alternative counts as an item-internal state change, not a view write (ADR 0081).
- **jreq** is a reference to an item or a blueprint:
  - an item's own jreq continues the chain, and the full chain is the sequence;
  - a `bp:` jreq is a **conditional prerequisite**: the blueprint's `jreq` output resolves to an item reference at evaluation time.
  - **Refusal:** the store refuses a jreq that reaches the item itself. This covers a direct self-reference, a chain through other items' jreqs, and items read by a conditional blueprint's item nodes (`World.canSetJreq`). The editor only offers allowed targets and reports refusals.
- **blueprint**: exactly one reference, used for scoring (its `score` output).
