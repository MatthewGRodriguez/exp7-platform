# 0057 — M13 verification notes

Status: record (2026-10-31).
- Factor reorder (in-page vs calcRanks order): float rounding only — max |score diff| 1.39e-17, max rel raw diff 3.07e-16, 117/180 bit-identical. Accepted, not a parity break.
- WebGPU: headless Chrome on this Mac exposes `navigator.gpu` with an adapter even without flags; ranking_data reports backend `webgpu`, parityOk true. Optional `CDP_EXTRA_FLAGS` was tried only in a /tmp copy and not committed.
- rank_parity's jmethodMaxAbsDiff 1.11e-16 is pre-existing (same with the M12 jdata).
