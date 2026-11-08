# Architecture — JFactor Lab

- at: 2026-08-09
- status: lab · renamed from living-grok → **JFactor Lab**

## Stack

```
┌─────────────────────────────────────────────────────────┐
│  Outer author (human + Grok model)                      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Grok Build harness (Rust TUI / agent runtime)          │
│  · tools · skills host · MCP host · sessions · plan     │
└───────────────────────────┬─────────────────────────────┘
                            │ MCP (stdio)
┌───────────────────────────▼─────────────────────────────┐
│  living-core process kernel (Node)                      │
│  · hop0 · rankCycle · REVIEW · handoff TOON · debt      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  JFactor / Exp6 ranking kernel                          │
│  · SimulatedBest · score blend · SIMD/workers/GPU opts  │
└─────────────────────────────────────────────────────────┘
```

## Why “JFactor Lab”

**JFactor / Exp6** is the ranking math (simulate many, enter one).  
**living-core** is the densest process that *uses* that ranking under a host goal.  
**Grok Build** is the harness that talks to humans and tools.  

The lab studies the **boundary** — not a fork of Grok Build.

## Combine densest

| Approach | Status |
|----------|--------|
| MCP wire living-core | ✅ |
| Project skills | ✅ jfactor-lab skill |
| grok-build source study | ✅ vendor shallow clone |
| Rust fork of grok | ❌ not default · no external PRs |

## Paths

| Path | Role |
|------|------|
| `jfactor-lab/` | this lab project root |
| `vendor/grok-build/` | Apache-2.0 source transparency |
| `living-core/` | process kernel symlink |
| `vendor/exp6/` | JFactor Exp6 |
| `docs/THESIS.md` | research paper draft |
