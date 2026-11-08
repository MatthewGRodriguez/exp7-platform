# ADR 0108 — Exp7 op edge cases and the `changed` shape (working rules)

Status: working rules (2026-11-02; label "working rule, Matthew to confirm"; the `changed` shape is "shape agreed with codec, Matthew to confirm")

## Decision (spec 42 §3.7 rules 15–16)
- `add` of an existing **list** member: accepted no-op (nothing written; no owner/revision change; not listed in `changed`).
- `add` on an existing scalar/field path: **rejected** (`exists`); replacing is `set`.
- `remove` of a missing member: accepted no-op (a missing path is still `missing-path`).
- `ref` has no stale-revision check, like `set`: ownership by acting, latest accepted wins.
- Batches are 0..5000 ops; an empty batch is valid and succeeds with identical bytes (rule 14).
- An accepted outcome carries `changed: [{path, from}]`, one entry per path actually written, `from` = previous owner (`null` if none); this is the shape of the `changed` event entries.

## Consequences
- Checker `tools/gen_synthetic_proposals.js` implements this (`overwrote` kept for compatibility); `atlas/test/proposals_test.js` 12 → 17 checks.
- The same-seed 1x day keeps its counts (800 proposals, 3,155 ops) but some `baseRev` values differ because no-ops no longer bump the revision.
