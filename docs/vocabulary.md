# Vocabulary

| Term | Meaning | Pitfall |
|------|---------|---------|
| **Joy** | Ranked stock / factor dimension (attention, priority pool, calendar seat, …) | Do not call it “money” just because Exp6 samples used `money` |
| **JFactor / Exp6** | Ranking / Best machinery | Separate from Exp7 views and from Budget worksheet stubs |
| **Atlas** | Exp7 live data container (`items`, `joys`, `components`, …) | Not Exp6 “world” / JWorld |
| **calHtml / boardHtml / planHtml / depsHtml** | **Real** Exp7 view HTML builders inside the Atlas runtime | Stub Budget `renderCal` / `renderBoard` / `renderPlan` are **not** these |
| **moneyCalendarTemplate** | Atlas factory for money-oriented calendar+board+plan | Requirement path for Budget; **not** on verified `main` Budget package |
| **harmonic shares** | \((1/r)/\sum(1/k)\) over on-factor ranks; portion = share × pool span | Portion units = joy pool units, **not** auto-dollars |
| **Platform shell** | Host HTML: chrome, key memory, package mount, GitHub helpers | Distinct from embedded Exp7 lean app and from launcher |
| **Launcher** | Small HTML that embeds **no** platform; fetches release.json + payload | Must not ship platform inside the launcher file |
| **Software repo** | `MatthewGRodriguez/exp7-platform` | Never the place for personal atlas/proposal data |
| **Data repo** | User-owned public repo (default name historically `exp7-app-data`) | Separate from software updates |
| **Proposal-op sync** | Platform publishes/fetches Exp7 proposal ops under `exp7-app-v1/` | **Incomplete** vs full application-level sync [REQ] |
| **Direct mount** | Inject app HTML/scripts into `#appSlot-*` in the same page | Opposed to iframe |
| **Reserved header** | Fixed top bar that **occupies layout space**; app starts **below** it | Transparent overlay chrome with `padding-top` is **not** the accepted UX |
| **Exclusive avatar** | GitHub image **or** fallback disc — never both visible | Half-button chrome / dual children are failures |
| **Lean Exp7** | v17-based demo minus experimental views / planner-scheduler seed | Search/scheduler research is **canceled** |
