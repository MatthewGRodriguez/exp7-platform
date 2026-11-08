# Harness session guide — JFactor Lab

- at: 2026-08-09  
- purpose: run **Grok Build** against this project with living MCP densest  

## Setup

```bash
cd "/Users/[REDACTED-USER]/Home/Dev/The Joy Machine 2/jfactor-lab"
node scripts/smoke_wire.js
node scripts/dump_measures.js
grok --version    # expect grok 1.x
```

MCP: `.grok/config.toml` points at `living-core/mcp/stdio.js`.

### living-core modality + tool densest

| Path | Effect |
|------|--------|
| Best `jfactor_lab` | prepare pack when stale · surface page |
| `living_jfactor_lab action=harness apply=true` | open Terminal + **grok** + HARNESS seed |
| `living_jfactor_lab action=arxiv_open apply=true` | prepare + open arXiv submit (human login) + reveal zip |
| dry_run (default for open) | plan only |

Open TUI:

```bash
grok
# or
./scripts/open_lab_terminal.sh
# or via living-core MCP / node:
# node -e "require('./src/jfactor_lab_ops').harness({apply:true})"
```

## Headless smoke (verified lab)

```bash
grok -p "Reply with exactly one line: JFACTOR_LAB_OK" --cwd "/Users/[REDACTED-USER]/Home/Dev/The Joy Machine 2/jfactor-lab"
# → JFACTOR_LAB_OK
```

## Operate densest (inside Grok)

Use **skill** `jfactor-lab` / `living-operate` judgment first, then MCP hands:

| Step | Action |
|------|--------|
| 1 | `living_sense` (host) — read `open_next=` · `session=` · `skills=` |
| 2 | Branch open_next (REVIEW → ranking review only if intentional) |
| 3 | `living_token_view action=handoff modality=host` — re-enter pack |
| 4 | `living_rank_cycle` — one densest Best under host goal |
| 5 | `living_skill action=get id=research__wrote` — JIT procedure if research |
| 6 | Edit paper only when findings change (not mtime thrash) |

## Prompt seeds densest

**A — hop0 read**

```
Call living_sense for host. Quote open_next, session, last_capture, perf.
Do not list all MCP tools. Summarize densest next step only.
```

**B — protocol check**

```
Read docs/PROTOCOL_hop0.md. Map hop0_latest.txt lines to the protocol table.
Note any missing required fields.
```

**C — paper edit**

```
Read docs/ABSTRACT.md and docs/measures_latest.json.
If measures drifted >5% from abstract numbers, propose a one-paragraph patch only.
```

**D — law**

```
Never invent money. Do not approve REVIEW proposals unless I name ids.
Grok Build = harness · living-core = process · JFactor = rank.
```

## After session

```bash
node scripts/dump_measures.js
./scripts/pack_submit.sh
```

Capture densest note in living-core if intentional:

```
living_capture text="JFactor Lab harness session · …"
```
