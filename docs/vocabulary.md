# Vocabulary

| Term | Meaning | Pitfall |
|------|---------|---------|
| **Joy** | Ranked stock / factor dimension (attention, priority pool, calendar seat, …) | Do not call it “money” just because Exp6 samples used `money` |
| **JFactor / Exp6** | Ranking / Best machinery | Separate from Exp7 views |
| **Atlas** | Exp7 live data container (`items`, `joys`, `components`, …) | Not Exp6 “world” / JWorld |
| **calHtml / boardHtml / planHtml / depsHtml** | **Real** Exp7 view HTML builders inside the Atlas runtime | Stub `renderCal` / `renderBoard` / `renderPlan` are **not** these (removed from tip) |
| **Exp7Views** | Canonical reusable Cal/Board/Plan feature (`exp7-views@1`): builders → JRViews → JRender | Apps must not fork builders; atlases stay per-app |
| **Universal views** | One view *design* shared by every app | Does **not** mean shared Board/Cal data across apps |
| **One JRender everywhere** | Apps + platform chrome draw via real JRender (shared Core/GPUContext; many canvases today) | Account/key may stay DOM so PAT never enters canvas — see [views-jrender-standard.md](./views-jrender-standard.md) |
| **mountSurface** | Exp7Views API: mount N views (Cal / boards / Plan) on one atlas with shared renderer | Prefer over ad-hoc repeated `setView` when an app owns several roots |
| **PlatformChromeJR** | Shell helper that paints reserved bar + apps picker through JRViews | Without WebGPU: leaves DOM chrome visible |
| **budgetChromeDoc** | Host injects Budget Cal/Board/Plan (+ type) buttons into the view document for slabs/parallax | Must run **after** `planDoc` (which strips non-deps siblings) |
| **Exp7Slabs** | Parallax / ambient motion layered on JRViews scenes | Hooks `View.show`; global pointermove |
| **jr-on / jr-chrome** | CSS/mode flags: platform bar/apps JR active; Budget DOM tabs hidden | Budget class lives on `#budgetRoot` inside `#appSlot-budget` (scoped CSS) |
| **no-adapter** | JRender error when `requestAdapter` returns null | Expected on many VMs; DOM / `.jrerr` fallback — not Mac proof |
| **moneyCalendarTemplate** | Atlas factory that adds moneyPreset chrome on a calendar | Prefer `calendarTemplate` + `normalizeDemoViews` for Budget/demo parity |
| **harmonic shares** | \((1/r)/\sum(1/k)\) over on-factor ranks; portion = share × pool span | Portion units = joy pool units, **not** auto-dollars |
| **Platform shell** | Host HTML: chrome, key memory, package mount, GitHub helpers | Distinct from embedded apps and from launcher |
| **Launcher** | Small HTML that embeds **no** platform; fetches release.json + payload | Must not ship platform inside the launcher file |
| **Software repo** | `MatthewGRodriguez/exp7-platform` | Never the place for personal atlas/proposal data |
| **Data repo** | User-owned public repo (default name historically `exp7-app-data`) | Separate from software updates |
| **Proposal-op sync** | Platform publishes/fetches Exp7 proposal ops under `exp7-app-v1/` | **Incomplete** vs full application-level sync **[REQ]** |
| **Direct mount** | Inject app HTML/scripts into `#appSlot-*` in the same page | Opposed to iframe; CSS scoped under `#appSlot-*` |
| **Reserved header** | Fixed top bar that **occupies layout space**; app starts **below** it | Transparent overlay chrome is **not** the accepted UX |
| **Exclusive avatar** | GitHub image **or** fallback disc — never both visible | Half-button chrome / dual children are failures |
| **Lean Exp7** | v17-based demo minus experimental views / planner-scheduler seed | Search/scheduler research is **canceled** |
