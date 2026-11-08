# ADR 0096: `merge` node, `condition.b` input, `view.label` input

Status: accepted (2026-11-01), M19.

- `merge a,b,c,d -> out`: per key, the first non-empty value. Several conditions can paint one style map in priority order (bad > low > tight > busy).
- `condition` gains input `b` (a number or per-key map) that overrides the `value` param, so thresholds can come from joys (warning, warning×(1+margin)).
- `view` gains input `label`: a per-day map written to `state.dayLabels` and shown under the day number (format from `view.labelFmt`, e.g. money).
