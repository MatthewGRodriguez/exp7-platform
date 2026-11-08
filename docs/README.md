# Exp7 Platform documentation

**Scope:** project notes + **historical source archives** for the public software repo `MatthewGRodriguez/exp7-platform`.  
**Rule:** documentation / inert archive only. It does not authorize release integration, app runtime changes, launcher, or `release.json` edits.

## Verified live tip (read again before acting)

| Field | Value |
|-------|--------|
| Checked | 2026-11-08 (Cursor docs pass; `git fetch` + public raw) |
| Branch | `main` |
| Commit | `69a2cd9bb34a18926ee1e4b8db73b56406e6a6fb` |
| Manifest version | **1.5.0** |
| Payload | `exp7-platform/exp7-platform-lean.html` |
| Manifest SHA-256 | `7420b9f6c459133f2f8f1cd3f5b223f1c1fc9f487b5be7ce6d71f5c9867c6d09` (matches file bytes on that commit) |
| Open PRs | **none** (`gh pr list --state open` empty) |
| Closed unmerged of note | PR #7 (1.6.0 candidate claims), PR #3 (direct-mount PR closed; Matthew later put direct mount on `main` by hand), PR #2 |

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
| [vocabulary.md](./vocabulary.md) | Joy vs money, Atlas, Board shares, platform terms |
| [architecture.md](./architecture.md) | Platform shell, apps, mount model, sync boundary, JRender |
| [decisions.md](./decisions.md) | Accepted / rejected / substituted approaches |
| [version-lineage.md](./version-lineage.md) | Demo lean history + platform release lineage on GitHub |
| [distribution-launcher.md](./distribution-launcher.md) | Software vs data repos, launcher gate, handoff |
| [testing-provenance.md](./testing-provenance.md) | What was tested where; Mac vs box vs mock limits |
| [known-issues-acceptance.md](./known-issues-acceptance.md) | Recurring failures and acceptance criteria |
| [requirements-vs-main.md](./requirements-vs-main.md) | **Gap table:** [REQ] vs verified 1.5.0 `main` vs closed PR claims |
| [lore-migration-pending.md](./lore-migration-pending.md) | Lore **158 + 41 redacted**; ranking_ui archive status; gaps |
| [lore/README.md](./lore/README.md) | Lore archive home (public-safe + redacted paths) |
| [lore/REDACTED-SUPPLEMENT.md](./lore/REDACTED-SUPPLEMENT.md) | 41 privacy-redacted Lore docs |
| [lore/HISTORICAL-VS-CURRENT.md](./lore/HISTORICAL-VS-CURRENT.md) | Archive vs newer requirements (conflicts left unresolved) |
| [archives/ranking_ui/README.md](./archives/ranking_ui/README.md) | Partial sanitized ranking_ui source archive (not runnable) |
| [sources/2026-11-08-exp7-context-handoff.md](./sources/2026-11-08-exp7-context-handoff.md) | Preserved historical handoff (not proof of current code) |

## Archive migration

- Lore: **158** public-safe + **41** redacted (1 income record still withheld). Design ≤49, ADR ≤0111. **Not** complete/latest.  
- ranking_ui: **75** snapshot files + sanitized `ranking_ui.html.txt`; schedule minutes redacted; **not** integrated/runnable.  
See [lore-migration-pending.md](./lore-migration-pending.md).

## Non-goals for documentation / archive work

- No platform/runtime HTML, launcher, or `release.json` edits; no version bump/merge/release  
- No executable integration of archives into the shipped platform  
- No secrets, keys, account digits, or private financial/schedule values in git  
- Raw private `ranking_ui.html` must never enter commits  
- Do **not** resume canceled search / scheduler / Timefold / “v50” research  
- Do **not** mix this into app PRs (e.g. closed PR #7)