# JFactor Lab

**Lab:** Grok Build (harness) × living-core (densest process kernel) × **Exp6 / JFactor** (ranking).

Name: **JFactor Lab** — process ranking + attention densest beside the coding harness.

Goal: improve how coding agents **attend, rank, re-enter, and hand off** — beyond “add more skills/MCP tools” — then document findings as research contribution.

## Law

```
Grok Build  = harness (TUI · tools · skills · MCP host · sessions)
living-core = densest process via MCP (sense · rankCycle · hop0 · REVIEW)
JFactor/Exp6 = ranking / SimulatedBest kernel
Grok        = always outer author
```

## Layout

```
jfactor-lab/
├── living-core/          → symlink to ../living-core
├── vendor/
│   ├── grok-build/       → shallow clone xai-org/grok-build (Apache-2.0)
│   └── exp6/             → Exp6 / JFactor ranking
├── docs/
│   ├── ARCHITECTURE.md
│   ├── THESIS.md         research paper draft
│   └── CONTRIBUTION_PATH.md
├── .grok/config.toml
└── scripts/
    ├── smoke_wire.js
    ├── lab.command
    └── open_lab_terminal.sh
```

## Quick start

```bash
cd "/Users/[REDACTED-USER]/Home/Dev/The Joy Machine 2/jfactor-lab"
node scripts/smoke_wire.js
node scripts/dump_measures.js   # thesis appendix data
./scripts/pack_submit.sh        # → dist/jfactor-lab-submit-*.zip
./scripts/open_lab_terminal.sh
grok                    # TUI · project MCP living
less docs/ABSTRACT.md
less docs/SUBMIT.md
```

## Lab measures (dump · re-run `node scripts/dump_measures.js`)

| Metric | Value |
|--------|-------|
| hop0 pack | **500** tok_est |
| handoff pack | **[REDACTED-AMOUNT]** tok · **save [REDACTED-AMOUNT]** |
| MCP tools/list core | **[REDACTED-AMOUNT]** tok · **save [REDACTED-AMOUNT]** vs full **[REDACTED-AMOUNT]** |
| `runtime.js` wire | **359** lines (from ~2900) |

**Submit pack:** `docs/SUBMIT.md` · `./scripts/pack_submit.sh` → `dist/jfactor-lab-submit-*.zip`  
**arXiv checklist:** `docs/ARXIV.md`  
**Open protocol:** `docs/PROTOCOL_hop0.md` · paper: `docs/PAPER.md`  
**Harness:** `docs/HARNESS_SESSION.md` · `./scripts/harness_smoke.sh`

## Research thesis (one line)

Coding-agent context rot is a **process ranking** problem: skills + MCP still need hop0 attention, rankCycle, and re-enter fidelity — **JFactor Lab** studies that stack under Grok Build.

See [docs/THESIS.md](docs/THESIS.md).

## Upstream note

`vendor/grok-build` does **not** accept external PRs. Contribution = paper + protocol + skills/MCP extensions.

## License

- living-core / Exp6 / JFactor Lab docs: Joy Machine lab  
- grok-build: Apache-2.0 (SpaceXAI)
