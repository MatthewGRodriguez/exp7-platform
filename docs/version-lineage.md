# Version lineage

## Exp7 demo / lean (app package history) [historical handoff]

| Line | Notes | Evidence |
|------|-------|----------|
| v13 motion | Accepted on Matthew’s visual check 2026-11-06 ~23:30 CST | [USER-HW]; GPU/perf QA never done [OPEN] |
| Box motion QA | CPU GPU command recorder; “Box GPU adapter unavailable” | [MOCK] |
| v14 | Light theme | historical |
| v15 | Experimental views (Matrix, What-if, Dependency graph, Ownership timeline) | historical |
| v16 | (handoff placeholder) | historical |
| v17 | Local collaborative editing: RGA notes, LWW label, movable order, own-intent undo, binary log exchange — **local only**, not durable/authenticated | historical |
| v18–v20 | Planner/scheduler-only experiments; v20 = v17 + planner scripts | **Do not resume** search/scheduler [REQ] |
| **Lean (2026-11-07)** | Based on **v17**; keeps editing; removes experimental views, planner tab, scheduler/planner seed; core scripts 0–18 reported byte-identical to v17 | handoff sizes: lean 1 487 141 B vs v17 1 532 837 B; jsdom 16/16 **[MOCK]** |

**Canceled:** search optimization, benchmarks, Timefold comparison, “v50” research line. [REQ 2026-11-07]

## Platform releases on GitHub `main` [MEAS 2026-11-08]

Verified by `git fetch origin main`, `git log`, `release.json` on tip, and public raw HTTP 200 for manifest.

| Version | How it landed | Commit (merge or tip) | Notes |
|---------|---------------|------------------------|-------|
| 1.2.0 | PR #1 merged | `12f3f4d…` | Initial lean publish |
| (post-1.2 manual) | Matthew closed PR #3; **manual** commits of HTML + manifest | `7eb37a4`, `0f80e29` | Direct mount path attributed to these manual updates [USER-HW rendering] |
| 1.3.0 | PR #4 merged | `7fcc965` / merge `e56d287` | Simplify UI; automatic Exp7 **proposal-op** sync |
| 1.4.0 | PR #5 merged | `29693b7` / merge `7748add` | App-first; back + avatar chrome |
| **1.5.0** | PR #6 merged | `0ce3053` / merge **`69a2cd9bb34a18926ee1e4b8db73b56406e6a6fb`** | **Current `main`**: Budget **stub** package + chrome tweaks |
| 1.6.0 | PR #7 **closed, not merged** | branch tip exists; **not** `main` | [CLAIM] only until Matthew accepts |

### Current manifest (verbatim fields) [MEAS]

```json
"version": "1.5.0",
"file": "exp7-platform/exp7-platform-lean.html",
"sha256": "7420b9f6c459133f2f8f1cd3f5b223f1c1fc9f487b5be7ce6d71f5c9867c6d09",
"minLauncherMajor": 1
```

Payload byte length on that commit: **2 061 979**. SHA matches manifest.

## PR disposition summary [MEAS]

| PR | Title theme | State |
|----|-------------|-------|
| #1 | Initial 1.2.0 | Merged |
| #2 | Open-app render / iframe-era fix | Closed unmerged |
| #3 | Direct mount 1.2.2 | Closed unmerged (manual follow-up on main) |
| #4 | 1.3.0 sync UI | Merged |
| #5 | 1.4.0 app-first chrome | Merged |
| #6 | 1.5.0 Budget + chrome | Merged |
| #7 | 1.6.0 real views + reserved bar | **Closed unmerged** |

Open PRs at docs check: **none**.
