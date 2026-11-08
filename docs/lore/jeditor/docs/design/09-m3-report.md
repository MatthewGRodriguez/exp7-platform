# M3 report: RANKS tab (ranking_ui v1)

## Built
- `RankBoard` component: factor importance list (drag), dimension pills, drag-ordered rank list (share % to 3 dp, value cell, non-factor toggle), "Best order · JFactor" and "All dimensions" tables.
- `rank_share` pack (JRankShare scorer, ADR 0017/0028), `JM.row('ranks')`, `JM.row('bestRank')`, metric `ranks.items`.
- EXPENSES Score column now live (0–800 + value−spend %). Rank items KPI = 60 (original: 60).
- `tools/cdp_shoot.js`: `spec.capture` (breakpoint eval) and `steps[].drag` (real CDP mouse drag).

## Verified (headless Chrome, temp profile)
- rank_parity PASS: shares/factor weights diff 0; calcRanks max diff 0 vs extracted functions and vs browser capture; rankItems 60=60 same order; Expense Score 97/97 identical; best rank source `sim` both sides, 59 acts, identical order, rating diff 0.
- motion_parity PASS.
- verify_m3_spec: 0 console errors, 0 exceptions, 0 external requests (only the local file, loaded twice for reload). Drag on T moved Work #3 → #1 (states dragging → drop-pending → settling); factor drag moved U to #1; both persisted across reload (`from: local`); Reset clears storage. M2b verify_spec still 0 errors.
- Shots: `levels/ranking_ui_v1/shots/m3/` vs `shots/original/orig_RANKS.png`: same items, values and shares (Snacks (use) 390 h 21.444%, Sleep 10.722%, Work 7.148%…; factor weights 36.794%…4.599%).

## Differences / unverified
- Board/acts/T-D-U-S caches are a snapshot (live in M4). Values-mode traversal, M-drag $ rewrite, mode toggle, "+ factor", "Higher ranking means" editor not ported.
- Layout differs: factor list on the left of the rank list rather than above; no top bar/date/live-log panel.
- Best order runs synchronously in JS in the bundle; the webgpu pill refers only to the scoreAsync kernel. Visual animation smoothness was not judged by a human.

## M4
CALENDAR tab → live Board items, acts and caches; values-mode ranking; remaining ranks controls.
