# Protocol: hop0 attention-live pack

- lab: **JFactor Lab**  
- codec: **attention-live-v2**  
- status: open protocol draft (implementable beside any harness)  
- at: 2026-08-09  

## 1. Purpose

A **hop0** pack is the densest re-enter surface for a coding / process agent:

- Not a full tool catalog  
- Not a full chat transcript  
- Not a full wiki dump  

It answers: **where am I, what is densest next, what just happened, can I re-enter?**

## 2. Layer law

| Layer | Role | hop0? |
|-------|------|-------|
| Harness tools | edit/shell/git | no (use harness) |
| Skills | judgment procedures | **skills=** ids only |
| MCP | hands | prefer core list; hop0 does not dump schemas |
| **hop0** | attention now | **this protocol** |
| Pages / memory | durable notes | **links=** densest ids |

```
MCP = hands · Skills = judgment · Pages = memory · hop0 = attention now
```

## 3. Wire format

- **Media type densest:** UTF-8 text, one field per line, `key=value` (space-separated multi-values).  
- **Envelope (optional JSON):**

```json
{
  "codec": "attention-live-v2",
  "line0": "here=host ...",
  "lines": ["here=...", "law=...", "..."],
  "text": "here=...\nlaw=...\n",
  "densest": true
}
```

- **Tokenizer note:** lab tok_est = ⌈chars/4⌉ for relative save; not gold BPE.

## 4. Line order (KV-prefix friendly)

Order is intentional (stable → semi → dynamic):

### 4.1 Stable (prefix-cache friendly)

| Line | Required | Semantics |
|------|----------|-----------|
| `here=` | yes | current locus: `here=host path=host›… modality=host status=stable` |
| `law=` | recommended | fixed quality law string (do not churn) |
| `loop_ok=` | recommended | preflight: `Y/N` · `repeat=` · `gate=` · `budget=` · `tools=` |
| `goals=` | if any | open goals densest (cap ~6) |
| `links=` | if any | densest page ids (cap ~6) |

### 4.2 Semi (slow change)

| Line | Semantics |
|------|-----------|
| `skills=` | `child/did×N` or package ids (catalog only, not full bodies) |
| `open_next=` | densest next action / debt / REVIEW |
| `forecast=` | short next-step hint |
| `accel=` | optional SIMD/workers/GPU thresholds |
| `binary=` | optional wasm/cold/src tags |

### 4.3 Dynamic (every sense)

| Line | Semantics |
|------|-----------|
| `related=` | densest neighbor pages `id~score` |
| `bytes_est=` / `bytes_cap=` / `pressure=` | store pressure |
| `loop=` | phase · open_goal · last_best · parent_j |
| `perf=` | `total=` · `explore=` · `sim=` · `best=` · `fast|thorough` |
| `mem=` | free_gb · pressure |
| `lifecycle=` | probe flags densest |
| `session=` | last-K Best: `child/Y|N/j` |
| `last_capture=` | densest capture (captures_tail SoT) |
| `last_lore=` | optional VCS/lore densest |
| `why=` | last enter reason densest |
| `children_ranked=` | `id:j:status` (unscored j = `—`) |
| `nested=` | nested Best chain densest |
| `research_tail=` | prefer Open densest, not meta densified_at |
| `token_view=` | boundary format (e.g. toon) · sample tok |
| `hidden=` | hidden layers under pressure |

## 5. open_next (control)

`open_next=` is the process branch densest:

| Pattern | Meaning |
|---------|---------|
| `calendar_debt …` | enter calendar / rewrite densest map |
| `REVIEW pending_proposals …` | human gate · never invent $ |
| `research_debt …` | densest research findings |
| `operate_close` / similar | rankCycle / user densest help · no roadmap farm |

**Law:** no roadmap farm when open_next points at operate/REVIEW/debt.

## 6. session= and last_capture= (re-enter)

| Field | SoT densest | Failure mode |
|-------|-------------|--------------|
| `session=` | history_tail / session_tail | empty `—/N` if slim rows not rehydrated |
| `last_capture=` | **captures_tail** preferred over stale loop | lag after capture if loop wins |

Implementations MUST prefer durable tails over in-memory loop when they disagree.

## 7. Companion: handoff pack

Separate from hop0, a **handoff** pack is smaller re-enter for agent/session transfer:

- Lab measure: ~75 tok vs hop0 ~500 tok · save ≈0.85  
- Law: handoff ≪ full dump · transfer densest not everything  
- Suggested keys densest: `here` · `open_next` · `last_best` · `skills` top · `forecast` · page JIT ids  

(Exact handoff schema may be versioned as `handoff-v1` later.)

## 8. Companion: MCP tools/list progressive

| Mode | Intent |
|------|--------|
| **core** (default) | operate densest (~9 tools) |
| dense | all tools short schemas |
| full | verbose schemas |

Lab: core ~753 tok · full ~2509 · save ~0.70.  
JIT: `tool_help action=get name=…`

## 9. rankCycle (process kernel, not hop0 body)

hop0 does not *run* the cycle; it *surfaces* state. Kernel stages densest:

```
sense → SimulatedBest → explore → densify? → Best(enter top) → sample → graduate?
```

Only Best winner performs real I/O (JFactor enter-one).

## 10. Non-goals

- Replace harness edit/shell/git  
- Embed full skill bodies in hop0  
- Auto-approve money  
- Upload codebases  

## 11. Conformance densest (minimal)

A hop0 producer is **minimally conforming** if it emits:

1. `here=`  
2. `open_next=` or explicit `open_next=none`  
3. `loop=` or equivalent phase  
4. `session=` or `session=—` when unknown  
5. Stable `law=` string that does not thrash every turn  

A consumer is conforming if it **reads hop0 before** dumping full tool catalogs or full skill libraries.

## 12. Example (abridged)

See lab file `hop0_latest.txt`. Shape:

```
here=host path=host modality=host status=stable
law=speed≠everything · …
loop_ok=Y repeat=Y gate=Y budget=Y tools=Y · preflight_ok
skills=research/wrote×N …
open_next=REVIEW pending_proposals · …
session=research/Y/0.17 …
last_capture=signal · …
perf=total=25 explore=1 sim=11 best=7 fast
children_ranked=research:0.173:stable … calendar_layers:—:stable
```

## 13. Versioning

| codec | note |
|-------|------|
| attention-live-v1 | legacy |
| **attention-live-v2** | current densest (stable/semi/dynamic order) |

Bump codec string on breaking field renames.

---

*JFactor Lab · living-core reference implementation · not affiliated with SpaceXAI*
