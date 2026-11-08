# ADR 0063 — Auto condition labels; doc-first shared joy values (M14b)

Status: accepted (2026-10-31)

- A condition label of the form `<metric> <op> <number>` (what the editor creates) is regenerated from the graph when the record is compiled, so it follows edited thresholds. Hand-written labels (the ranking_data defaults) are kept, so v1 parity is unchanged.
- The editor's "shared" joy value reads the stored value from the doc first and falls back to the preview only for derived joys, so "reset to shared" never shows the value from before the last (debounced, 180 ms) preview rebuild.
