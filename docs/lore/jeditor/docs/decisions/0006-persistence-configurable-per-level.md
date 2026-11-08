# ADR 0006: Persistence is configurable per level
Status: decided (2026-10-30)
Decision: whether user-changed values are kept between visits or reset on each open is a per-level setting chosen in the editor (`state.persist`: `"local"` = keep, `"none"` = reset each open).
See docs/design/03 (level metadata: storage key and version).
