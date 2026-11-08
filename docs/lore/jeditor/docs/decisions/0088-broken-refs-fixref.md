# ADR 0088: Broken references are shown and fixable

Status: accepted (2026-11-01), M17b.

- Delete still always works, and referrers are left untouched (ADR 0083).
- The editor's Broken list and the per-record markers show each broken reference as `from · path → to`.
- `World.fixRef(w, ref, newRef|null)` either repoints the reference to an existing record (a factor keeps its weight) or drops it: an array entry is spliced, pref/jreq become null, and the clock is turned off.
- Repointing a jreq goes through setJreq, so it cannot create a self or cyclic chain.
- `self` and `event` item nodes are never counted as references.
- A clock joy counts as a reference only while the clock is on.
