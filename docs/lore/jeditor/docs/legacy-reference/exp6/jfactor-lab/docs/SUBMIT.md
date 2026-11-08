# Submit guide — JFactor Lab

- at: 2026-08-09  
- status: **pack ready** · venue pick left to author  

## Claim densest

Skills and MCP are progressive **layers**. Coding agents still need a densest **process kernel** (hop0 + JFactor rankCycle + re-enter + human gates) **beside** the harness.

## Pack contents

Build with:

```bash
cd jfactor-lab
node scripts/dump_measures.js
./scripts/pack_submit.sh
# → dist/jfactor-lab-submit-YYYYMMDD.zip
```

| File | Role |
|------|------|
| `ABSTRACT.md` | ~167w workshop abstract |
| `THESIS.md` | full draft |
| `PAPER.md` | single-file assemble (read/export) |
| `PROTOCOL_hop0.md` | **open protocol** hop0 attention-live-v2 |
| `ARCHITECTURE.md` | stack map |
| `REPRO.md` | how to remeasure |
| `REFERENCES.md` | dated primaries (MCP / Skills / Grok Build) |
| `CONTRIBUTION_PATH.md` | no external PRs honesty |
| `SUBMIT.md` | this file |
| `measures_latest.json` | numbers dump |
| `hop0_latest.txt` | hop0 sample |

## Venue options densest

| Track | Fit | Note |
|-------|-----|------|
| **arXiv cs.AI / cs.SE** | primary | see **`ARXIV.md`** checklist + plain abstract paste |
| **Agent / tool-use workshop** | good | abstract + short paper; check CFP word limits |
| **Blog + protocol RFC** | fast | publish `PROTOCOL_hop0.md` + `PAPER.md` |
| **Grok Build monorepo PR** | **no** | upstream does not accept external PRs |

**Recommend densest path:** arXiv (cs.AI primary, cs.SE secondary) — follow **`ARXIV.md`**.

## Pre-submit checklist

1. `node scripts/dump_measures.js` — paste fresh numbers into ABSTRACT/THESIS if drift  
2. Confirm REFERENCES URLs still resolve  
3. Add 2–3 peer-reviewed agent/tool-use papers if venue requires  
4. License note: lab prose Joy Machine; grok-build study is Apache-2.0 third-party  
5. Do **not** claim official xAI affiliation  

## Measures freeze (last dump example)

| Metric | ≈ |
|--------|---|
| hop0 | 500–510 tok_est |
| handoff | 75 tok · save ≈0.85 |
| MCP core | 753 tok · save 0.70 vs full 2509 |
| runtime.js | 359 lines |

## After submit

- Record arXiv id / workshop name in `research_jfactor_lab.md`  
- Optional: public protocol page (hop0 schema) separate from narrative paper  
