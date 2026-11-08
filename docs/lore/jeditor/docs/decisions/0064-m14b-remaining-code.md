# ADR 0064 — What stays code after M14b

Status: accepted (2026-10-31)

Stays code, wrapped as packs or `lib.value` nodes, with reasons:
- `calendar_model.js` + `easy_calendar_extract.js` (ledger, recurrence and plan internals): calendar parity (36 checks) compares them byte for byte with the original. Exposed as `calendar.*` library nodes (ADR 0062).
- JGroup Best / SimulatedBest (Exp6 engine): the Exp6 parity checks need the vendor bundle's own search. A node would only wrap the same call.
- RankBoard drag orders and caches: still in `ranks.*` state. They are already readable by blueprints through the `w_*` joys, which are derived outputs. They are not input knobs.
- DEBT row library and money libraries: already `lib.value` nodes (`calendar.debt*`, `money.*`). Rewriting them as graphs would duplicate the original formulas without a parity gain.
- Internals of hints, forms, header/KPIs and shell state: they bind through blueprint outputs (14 bindings since M11–M13). Their rendering stays component code.
