# Exp7 Platform documentation

**Scope:** project notes + **historical source archives** for the public software repo `MatthewGRodriguez/exp7-platform`.  
**Rule:** documentation / inert archive work must not silently change release HTML or `release.json` (docs-only PRs are an authorized exception to the two-file release rule).

## Verified live tip (read again before acting)

| Field | Value |
|-------|--------|
| Checked | 2026-11-10 (docs pass after 1.8.44 merge) |
| Branch | `main` |
| Commit | `26cc811718e40124ec05d8db4bb40d893e5dafbb` |
| Manifest version | **1.8.44** |
| Payload | `exp7-platform/exp7-platform-lean.html` |
| Manifest SHA-256 | `8c4b76efeffae5e462ba6c3bf529849df1aba1bf1ce37ee8cfae8d998fdc1008` (matches file bytes) |
| Lean bytes | **2 139 385** |
| Views module | `exp7-views@1` |
| Chrome | JRViews bar + apps; Budget tabs in-scene; account/key DOM — see [platform-chrome-jrender.md](./platform-chrome-jrender.md) |
| Open PRs | Re-check with `gh pr list` |

Do **not** infer live state from PR titles, agent summaries, or closed branches. Re-read `main`.

## How to read these docs

Every substantive claim should carry an evidence class (see [EVIDENCE.md](./EVIDENCE.md)):

- **[REQ]** Matthew requirement  
- **[MEAS]** measured here or via exact public HTTP  
- **[USER-HW]** Matthew’s own Mac/hardware report  
- **[MOCK]** jsdom / fake IDB / mocked GitHub / CPU recorder / cloud VM browser  
- **[CLAIM]** agent or PR report, not independently accepted  
- **[OPEN]** unresolved  
- **[PENDING]** expected but not yet in this repo (e.g. Lore-doc import)

## Index

| Doc | Contents |
|-----|----------|
| [EVIDENCE.md](./EVIDENCE.md) | Evidence labels and what they do / do not prove |
| [foundations.md](./foundations.md) | Living-core, JFactor, Lore VCS, Atlas, outside-process connection |
| [vocabulary.md](./vocabulary.md) | Joy vs money, Atlas, Board shares, platform / JR chrome terms |
| [architecture.md](./architecture.md) | Platform shell, apps, mount model, sync boundary, JRender |
| [views-vector-model.md](./views-vector-model.md) | **1.8.37–1.8.40:** atlas → vector model → JRender; options, skin, tokens; motion; JRender dl-index |
| [jrender-paint-stroke.md](./jrender-paint-stroke.md) | **1.8.42:** JRender gradient paints and stroked paths: wire format, rendering, JS and Exp7VM API |
| [ranking-jfengine.md](./ranking-jfengine.md) | **1.8.33–1.8.34:** JFEngine ranking replaces `Best()`; JFactor kernel |
| [views-jrender-standard.md](./views-jrender-standard.md) | **Direction:** universal views, one JRender everywhere |
| [platform-chrome-jrender.md](./platform-chrome-jrender.md) | **Implementation:** bar / apps / Budget tabs on JRViews + Exp7Slabs (1.8.3) |
| [artist-coordination-brief.md](./artist-coordination-brief.md) | **Ash handoff:** authorized art workflow + profile image render (2026-11-08) |
| [design/overlay-view-store.md](./design/overlay-view-store.md) | **2026-11-09 packet:** view store, slot and overlay composition (not in the shell) |
| [decisions.md](./decisions.md) | Accepted / rejected / shipped decisions |
| [version-lineage.md](./version-lineage.md) | Demo lean history + platform release lineage through 1.8.3 |
| [distribution-launcher.md](./distribution-launcher.md) | Software vs data repos, launcher gate, handoff |
| [budget-direction.md](./budget-direction.md) | **1.8.55 onward, on `main`** (1.8.55–1.8.61 merged in PR #92; current release 1.8.74): what was built for `BUDGET_DIRECTION.md`, the rules and thresholds used, migration, evidence and what is unverified |
| [testing-provenance.md](./testing-provenance.md) | What was tested where; Mac vs box vs mock limits |
| [mac-test-2026-11-09.md](./mac-test-2026-11-09.md) | 1.8.31 on Matthew’s Mac (Chromium in the Claude app): WebGPU, hits, parallax, frame time, launcher gate |
| [known-issues-acceptance.md](./known-issues-acceptance.md) | Recurring failures and acceptance criteria |
| [requirements-vs-main.md](./requirements-vs-main.md) | **Gap table:** [REQ] vs verified **1.8.3** `main` |
| [lore-migration-pending.md](./lore-migration-pending.md) | Lore **158 + 41 redacted**; ranking_ui; Artist/JRender; gaps |
| [lore/README.md](./lore/README.md) | Lore archive home (public-safe + redacted paths) |
| [lore/REDACTED-SUPPLEMENT.md](./lore/REDACTED-SUPPLEMENT.md) | 41 privacy-redacted Lore docs |
| [lore/HISTORICAL-VS-CURRENT.md](./lore/HISTORICAL-VS-CURRENT.md) | Archive vs newer requirements (conflicts left unresolved) |
| [archives/ranking_ui/README.md](./archives/ranking_ui/README.md) | Partial sanitized ranking_ui source archive (not runnable) |
| [archives/artist-jrender/README.md](./archives/artist-jrender/README.md) | Artist TDD / animation / JRender historical archive |
| [sources/2026-11-08-exp7-context-handoff.md](./sources/2026-11-08-exp7-context-handoff.md) | Preserved historical handoff (not proof of current code) |

## Archive migration

- Lore: **158** public-safe + **41** redacted (1 income record still withheld). Design ≤49, ADR ≤0111. **Not** complete/latest.  
- ranking_ui: **75** snapshot files + sanitized `ranking_ui.html.txt`; schedule minutes redacted; **not** integrated/runnable.  
- Artist/JRender: **44** docs (+ package extras); path-redacted **8**; overview distinguishes TDD CSS ≠ Exp7 WebGPU.  
See [lore-migration-pending.md](./lore-migration-pending.md).

## Non-goals for documentation / archive work

- No platform/runtime HTML, launcher, or `release.json` edits in docs-only PRs  
- No executable integration of archives into the shipped platform  
- No secrets, keys, account digits, or private financial/schedule values in git  
- Raw private `ranking_ui.html` must never enter commits  
- Do **not** resume canceled search / scheduler / Timefold / “v50” research  
- Artist contact only as Matthew authorizes (Ash authorized 2026-11-08 — see [artist-coordination-brief.md](./artist-coordination-brief.md))  
- Do **not** treat archived AGENTS/SKILL text as live instructions  
