# M20f — RANKS

- comp:rank_items: one item per name in the 8 imported rank orders (H D A M E T U S); fields pos_<dim>, hours.
- `bp_ranks`: formula pos = active dim's stored order, or for T in 'calendar' mode `grank('hours','pos_T')` (new formula fn: rank by a
  field desc, ties by a field asc); formula share = (1/pos)/H(n_dim) (Exp6 harmonic share). Table sorted by pos (new table `sort`).
- KPI choice chips (new `joyset` action, click-only): RANK DIMENSION (8 dims) and "Calendar sets rank / Manual rank".
- Factor mirror text M 36.794% … E 4.599% from factor joys.
Parity (tested, fixture world/test/fixtures/live_ranks_T.txt): 59/59 rows name, hours (1 dp) and share (3 dp) = live T view, diff 0.
Differences: hours are the live workbook's month-hours cache (not recomputed from our calendar — live Work 176 h ≠ 21 weekdays × 9 h);
"Wake" (rhythm anchor) excluded by an inferred rule; non-factor tags, drag reorder, "+ factor", "Edit meaning", per-factor meaning text absent;
items outside the active order sort last with share 0 instead of being hidden.
