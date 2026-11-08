# ADR 0013: Condition metrics are editor-configurable
Status: decided (2026-10-30)
Decision (Matthew: "editor configurable"): the metrics a calendar highlight condition can use are defined in the editor, not a fixed list. Each level has a metric registry (`jfactor.metrics`: id, label, unit, source, ref, kind, scopes, aggregate); conditions reference registry ids. Built-ins cash-after-bills, goal margin and no-healthy-fallback are defaults.
See docs/design/06 and ADR 0012.
