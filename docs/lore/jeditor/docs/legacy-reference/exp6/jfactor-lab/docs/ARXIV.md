# arXiv / tech-report publish checklist — JFactor Lab

- at: 2026-08-09  
- status: **ready for author upload** (no account automation from this lab)

## Recommended classification

| Field | Value densest |
|-------|----------------|
| Primary | **cs.AI** |
| Secondary | **cs.SE** (optional) |
| Title | Densest Process Beside the Harness: JFactor Ranking, hop0, and Re-enter for Coding Agents |
| Comments | JFactor Lab tech report; includes open hop0 protocol (attention-live-v2); not affiliated with SpaceXAI |

## living-core densest (prepare + open)

```
living_jfactor_lab action=prepare
living_jfactor_lab action=arxiv_open apply=true
```

- rebuilds zip · opens https://arxiv.org/submit · reveals zip in Finder · opens ARXIV.md  
- **You** log into arXiv and complete upload (no API credentials in living-core)

## What to upload

**Minimum (abstract-first):**

1. `ABSTRACT.md` body → arXiv abstract field (plain text; strip markdown bold)  
2. PDF or source of `PAPER.md` / `THESIS.md`  

**Full pack (preferred):**

```bash
cd jfactor-lab
./scripts/pack_submit.sh
# upload dist/jfactor-lab-submit-YYYYMMDD.zip contents as ancillary
# or attach hop0_latest.txt + measures_latest.json as data
```

| File | arXiv role |
|------|------------|
| `PAPER.md` or PDF from it | main article densest |
| `ABSTRACT.md` | abstract field |
| `PROTOCOL_hop0.md` | ancillary / appendix |
| `measures_latest.json` | data |
| `hop0_latest.txt` | data sample |
| `REPRO.md` | reproducibility |
| `REFERENCES.md` | bibliography seed |

## Pre-flight (author)

1. [ ] Re-run `node scripts/dump_measures.js` same day as upload  
2. [ ] Paste latest numbers into abstract if drift >5%  
3. [ ] Confirm REFERENCES URLs resolve  
4. [ ] License: lab prose yours; third-party study of Apache-2.0 Grok Build (cite, don’t claim ownership)  
5. [ ] **No** “official xAI / SpaceXAI product” wording  
6. [ ] Optional: convert `PAPER.md` → PDF (pandoc) for cleaner arXiv HTML  

```bash
# optional PDF (if pandoc installed)
pandoc docs/PAPER.md -o dist/jfactor-lab-paper.pdf --from markdown --pdf-engine=xelatex
# or: pandoc docs/PAPER.md -o dist/jfactor-lab-paper.html
```

## arXiv abstract (plain text paste)

Copy from `ABSTRACT.md` workshop section; remove `**` markers:

```
Coding agents increasingly rely on skills (progressive procedure disclosure) and MCP (tool connectivity). These layers reduce how much procedure or catalog is loaded, but they do not decide which process step is densest now: what to open next, which child capability to enter for real I/O, or how to re-enter after reload without re-prefilling tools and docs. We present JFactor Lab, a study stack that places a densest process kernel (living-core) beside a coding harness (Grok Build) via MCP, driven by JFactor/Exp6 ranking: sense, SimulatedBest, explore, Best (enter one). The kernel emits an attention-live hop0 pack, a compact handoff for session re-enter, progressive core tools/list, debt-driven open_next, and a human REVIEW gate for money-bearing proposals. On lab dumps we measure hop0 ~500 tok_est, handoff ~75 tok (~85% save vs hop0 text), and MCP core tools/list ~753 tok (~70% save vs full ~2509). We argue contribution can proceed as open protocol and research even when upstream harnesses do not accept external monorepo PRs.
```

## After publish

1. Record arXiv id in living-core `store/pages/research_jfactor_lab.md`  
2. Optional: post protocol link (PROTOCOL_hop0) separately as “RFC densest”  
3. Do not open unsolicited PR on xai-org/grok-build  

## Workshop alternative

If CFP word limit <200: use `ABSTRACT.md` only + 2-page cut of `PAPER.md` §§1–4.  
If poster: one-liner + measures table + hop0 example from `hop0_latest.txt`.
