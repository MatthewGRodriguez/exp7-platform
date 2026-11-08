# Reproduce JFactor Lab measures

- at: 2026-08-09
- purpose: appendix for THESIS · independent re-run

## Prerequisites

- Node.js (living-core)
- Optional: `grok` binary on PATH (harness try)
- This repo layout:

```
jfactor-lab/
  living-core/     → process kernel
  vendor/grok-build/
  vendor/exp6/
  docs/
  scripts/
```

## Commands densest

```bash
cd "/path/to/jfactor-lab"

# 1) wire smoke (paths + hop0)
node scripts/smoke_wire.js

# 2) measures dump (THESIS tables)
node scripts/dump_measures.js
# → docs/measures_latest.json
# → docs/hop0_latest.txt

# 3) optional: open harness in this project
./scripts/open_lab_terminal.sh
# or: grok
```

## What is measured

| Key | Meaning |
|-----|---------|
| `hop0.tok_est` | attention pack size (`ceil(chars/4)`) |
| `handoff.handoff_tok_est` | re-enter pack vs hop0 |
| `mcp.core_tok_est` | default tools/list (~9 tools) |
| `mcp.full_tok_est` | full catalog tax |
| `kernel.runtime_js_lines` | createRuntime wire size |

**Law:** tok_est is relative densest, not a gold tokenizer. Report **save ratios** primarily.

## Expected shape (example lab run)

| Metric | ≈ |
|--------|---|
| hop0 | ~500 tok |
| handoff | ~75 tok · save ~0.85 |
| MCP core | ~753 tok · save ~0.70 vs full ~2509 |
| runtime.js | ~350–360 lines |

Exact numbers drift with hop0 content (skills counts, capture text). Re-run dump before paper freeze.

## MCP operate (inside Grok)

```
living_sense
living_token_view action=handoff modality=host
living_tool_help action=measure
```

## Non-goals

- Does not require building Grok Build from Rust  
- Does not auto-approve REVIEW / invent $  
- Does not upload codebases  
