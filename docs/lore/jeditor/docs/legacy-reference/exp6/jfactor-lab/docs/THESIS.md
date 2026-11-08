# Densest Process Beside the Harness  
## Progressive disclosure is not enough: JFactor ranking, hop0, and re-enter for coding agents

- lab: **JFactor Lab** (`jfactor-lab/`)  
- status: **draft · abstract cut + refs freeze 2026-08-09**  
- date: 2026-08-09  
- authors: Joy Machine / JFactor Lab (living-core × Exp6) · outer author Grok  
- relation: Grok Build (Apache-2.0 source study) + living-core process kernel + JFactor/Exp6 ranking  
- **submit pack:** `ABSTRACT.md` · this file · `REPRO.md` · `REFERENCES.md` · `measures_latest.json` · `hop0_latest.txt`  
- not official xAI · not a PR (upstream does not accept external contributions)

---

## Abstract

> Standalone workshop cut (~167 words): **`ABSTRACT.md`**.

Coding agents increasingly rely on **skills** (progressive procedure disclosure) and **MCP** (tool connectivity). These layers reduce *how much* procedure or catalog is loaded, but they do not decide *which process step is densest now*. We present **JFactor Lab**: densest **process kernel** (living-core) beside a coding **harness** (Grok Build) via MCP, driven by **JFactor/Exp6** ranking (sense → SimulatedBest → explore → Best enter-one), with hop0 attention pack, handoff re-enter, core tools/list, debt-driven open_next, and human REVIEW for money.

**Lab measures** (`measures_latest.json`):

| Surface | tok_est | save |
|---------|---------|------|
| hop0 | **500–508** | working set |
| handoff | **75** | **≈0.85** vs hop0 |
| MCP core (9) | **753** | **0.70** vs full **2509** |
| runtime.js | **359** lines | from ~2900 |

tok_est = ⌈chars/4⌉. Contribution = open research/protocol (no external Grok Build PRs).

**Keywords:** coding agents · JFactor · hop0 · MCP · agent skills · progressive disclosure · re-enter fidelity

---

## 1. Introduction

Coding agents fail less from “missing tools” than from **attention rot**:

1. Flat MCP catalogs tax init context.  
2. Skills improve procedure disclosure, not *which process step* is densest now.  
3. Session resume restores chat, not **process state** (last Best, debt, capture, timings).

**Claim.** Harness + skills + MCP are necessary but incomplete. Agents need a **process kernel** with ranked enter, hop0, re-enter fidelity, and human gates for money-bearing actions.

| Layer | Owner | Role |
|-------|--------|------|
| Harness | Grok Build | tools, TUI, sessions, skills host, MCP host |
| Process | living-core | hop0, rankCycle, debt, REVIEW, handoff |
| Rank math | **JFactor / Exp6** | SimulatedBest, score blend |

---

## 2. Related work (densest)

Full URLs: **`REFERENCES.md`** (freeze 2026-08-09).

| Thread | Relation to JFactor Lab | Cite |
|--------|-------------------------|------|
| **Agent Skills / progressive disclosure** | Skills = judgment; metadata→body JIT; we add process ranking | Anthropic 2025-10-16; agentskills.io |
| **MCP** | Hands/connectivity; catalog tax → core tools/list | Anthropic 2024-11-25; MCP spec 2026-07-28 |
| **Grok Build harness** | TUI/tools/sessions host; Apache-2.0 study | xai-org/grok-build; no external PRs |
| **Agent memory / second brain** | Pages = memory; hop0 = attention *now* | theme (expand at submit) |
| **Long-context / KV handoff** | Transfer densest state, not full dump | theme; lab handoff measure |
| **Simulate-then-act control** | JFactor SimulatedBest enter-one | theme + Exp6 |

We do **not** claim to replace harness TUI, sandbox, or model routing.

---

## 3. Design laws

```
MCP = hands · Skills = judgment · Pages = memory · hop0 = attention now
Grok Build = harness · living-core = densest process · JFactor/Exp6 = rank
never invent money · REVIEW human · densest first · no roadmap farm without debt
```

### 3.1 hop0 (attention-live pack)

Codec lines: `here` · `open_next` · `skills` · `session` · `last_capture` · `perf` · `related` · `binary` · debt.  
**Re-enter** without re-listing tools or dumping full HOW.

### 3.2 rankCycle (JFactor-shaped)

```
sense → SimulatedBest → explore → densify? → Best(enter top) → sample → graduate?
```

Only the winner performs real I/O. No-help explores #2. Nested Best under data when debt remains.

### 3.3 Progressive tools/list

Default MCP list **core** (~9 tools, ~753 tok) vs full (~2509 tok).

### 3.4 Re-enter fidelity (lab polish P73–P76)

| Signal | Failure | Fix |
|--------|---------|-----|
| session | slim history → empty | rehydrate best_top |
| last_capture | loop stale | captures_tail SoT |
| perf | only total_ms | stage ms persist |
| related | law-only triad | prefer operate densest edges |

---

## 4. Measurements (JFactor Lab)

Reproduce anytime: `node scripts/dump_measures.js` (see `REPRO.md`).

### 4.1 Attention vs dump

| Pack | tok_est | Note |
|------|---------|------|
| hop0 text | **500** | always-on attention (`hop0_latest.txt`) |
| handoff | **75** | save_vs_full **0.85** |

**Law:** handoff ≪ full dump · transfer densest not everything.

### 4.2 MCP catalog tax

| Mode | n tools | tok_est | save vs full |
|------|---------|---------|--------------|
| full | 26 | **2509** | 0 |
| dense | 26 short | 1679 | 0.33 |
| **core** (default) | **9** | **753** | **0.70** |

### 4.3 Kernel wire size

createRuntime progressive extract (C1): **~2900 → 359 lines** `runtime.js` orchestrator; modules own Best/rank/hop0.

### 4.4 Money gate

Sheet SoT · 29 pending REVIEW proposals in lab hop0 · **never auto-approve** · never invent $.

---

## 5. Beyond skills and MCP

| Gap | JFactor Lab answer |
|-----|-------------------|
| What to do *now* | hop0 `open_next` + debt floors |
| Which child to enter | rankCycle / Best (Exp6 scores) |
| Survive reload | session · capture · perf · related |
| Irreversible $ | REVIEW human gate |
| Catalog tax | MCP core list + skill JIT |

---

## 6. Contribution surface

Upstream Grok Build: **no external PRs**.

| Contribute | How |
|------------|-----|
| Research paper | this document |
| Protocol | hop0 schema · rankCycle stages · core tools/list profile |
| Extensions | skills + living MCP server |
| Practice | densest operate law for harness users |

See `CONTRIBUTION_PATH.md`.

---

## 7. Lab method

1. Shallow-clone Grok Build (`vendor/grok-build`).  
2. Run released `grok` against **JFactor Lab** with living MCP.  
3. Measure hop0 / handoff / tools/list.  
4. Iterate living-core process laws.  
5. Paper track → arXiv / workshop.

Reproduce:

```bash
cd jfactor-lab
node scripts/smoke_wire.js
node scripts/dump_measures.js   # → measures_latest.json · hop0_latest.txt
# optional harness: grok
# MCP: living_sense · living_token_view action=handoff
```

---

## 8. Discussion

**Separation.** Process ranking must not live only inside skill bodies (re-dump thrash).  
**Honesty.** No monorepo PR path; research + protocol still real.  
**Risk.** Over-process slows simple fixes — law: thorough ok if densest help; lean under mem pressure.  
**Name.** **JFactor Lab** centers ranking (JFactor/Exp6) as the mathematical heart of densest enter-one process control.

---

## 9. Conclusion

Skills and MCP are necessary progressive layers. A densest **process kernel** (hop0 + JFactor-shaped rankCycle + re-enter + gates) completes the stack beside the harness. **JFactor Lab** is the experimental home for that claim under Grok Build.

---

## References (lab)

See **`REFERENCES.md`** (seed list + freeze note). Densest:

- xai-org/grok-build (Apache-2.0; no external PRs)  
- living-core: `research_skills_vs_mcp.md`, `operate_runtime.md`, `research_jfactor_lab.md`  
- This lab: `REPRO.md`, `measures_latest.json`, `hop0_latest.txt`  
- MCP + skills progressive disclosure (cite dated URLs at submit)

## Appendix A — hop0 sample (lab)

```
open_next=REVIEW pending_proposals · living_ranking review/approve
session=craft/Y/0.16 research/Y/0.18 research/Y/0.17
perf=total=25 explore=1 sim=11 best=7 fast
skills=research/wrote×22 crystallize/wrote×10 …
```

## Appendix B — operate densest

```
living_sense
living_rank_cycle
living_token_view action=handoff modality=host
living_skill action=get id=research__wrote
```
