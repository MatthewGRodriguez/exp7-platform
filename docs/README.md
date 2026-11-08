# Exp7 Platform documentation

**Scope:** project notes for the public software repo `MatthewGRodriguez/exp7-platform`.  
**Rule:** this tree is documentation only. It does not authorize release, app, launcher, or `release.json` changes.

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
| [lore-migration-pending.md](./lore-migration-pending.md) | Lore import status: **158** public-safe docs imported; **not** complete/latest |
| [lore/README.md](./lore/README.md) | Historical Lore archive home (`jeditor/`, `living-core/`, inventory + hashes) |
| [lore/HISTORICAL-VS-CURRENT.md](./lore/HISTORICAL-VS-CURRENT.md) | Archive vs newer requirements (conflicts left unresolved) |
| [sources/2026-11-08-exp7-context-handoff.md](./sources/2026-11-08-exp7-context-handoff.md) | Preserved historical handoff (not proof of current code) |

## Lore docs migration

Public-safe box snapshot imported under [`lore/`](./lore/README.md): **158** byte-exact documents + inventory; **42** withheld (counts only). Design ≤49, ADR ≤0111. **Not** complete/latest canonical Lore — Mac freshness gap remains. See [lore-migration-pending.md](./lore-migration-pending.md).

## Non-goals for documentation work

- No app / HTML / launcher / `release.json` edits in docs PRs  
- No version bump, merge, or release publication from docs work  
- No contact with the Artist  
- No secrets, keys, account, or private financial data  
- Do **not** resume canceled search / scheduler / Timefold / “v50” research  
- Do **not** mix documentation into app PRs (e.g. closed PR #7)
