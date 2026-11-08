# References — JFactor Lab / THESIS

- freeze date: **2026-08-09**  
- status: dated URLs for paper draft · add peer venues before final submit  

## Primary (cite these)

### Model Context Protocol (MCP)

1. Anthropic. *Introducing the Model Context Protocol.* 2024-11-25.  
   https://www.anthropic.com/news/model-context-protocol  

2. Model Context Protocol. *Specification* (version **2026-07-28**, latest at freeze).  
   https://modelcontextprotocol.io/specification/2026-07-28  
   Schema: https://github.com/modelcontextprotocol/specification  

3. Model Context Protocol Blog. *The 2026-07-28 Specification.* 2026-07-28.  
   https://blog.modelcontextprotocol.io/posts/2026-07-28/  

4. Hou, X. et al. *Model Context Protocol (MCP): Landscape, Security Opportunities and Challenges* (arXiv). 2025.  
   https://arxiv.org/pdf/2503.23278  

**Thesis use:** MCP = **hands** (connectivity), not procedure library; catalog tax motivates core tools/list.

### Agent Skills / progressive disclosure

5. Anthropic Engineering. *Equipping agents for the real world with Agent Skills.* 2025-10-16.  
   https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills  
   Progressive disclosure: metadata → body JIT → deeper assets.

6. Agent Skills open standard. *agentskills.io* (published as open standard 2025-12-18 per Anthropic update).  
   https://agentskills.io/  

7. Zhang et al. / survey. *Agent Skills for Large Language Models: Architecture…* (arXiv HTML 2602.12430). 2026.  
   https://arxiv.org/html/2602.12430v3  

**Thesis use:** Skills = **judgment** packages; still need process ranking for *what to enter now*.

### Coding harness (Grok Build)

8. SpaceXAI. *Grok Build* source tree (Apache-2.0).  
   https://github.com/xai-org/grok-build  
   Product: https://x.ai/cli · docs: https://docs.x.ai/build/overview  

9. SpaceXAI. *CONTRIBUTING.md* — external PRs **not** accepted (source transparency).  
   In-tree: `vendor/grok-build/CONTRIBUTING.md`

**Thesis use:** harness study + local build; contribution via paper/protocol, not monorepo patches.

## Secondary themes (expand for journal)

| Theme | Why it appears |
|-------|----------------|
| Long-context / KV handoff | Analogy for densest transfer (lab handoff pack) |
| Multi-armed / simulate-then-act | JFactor SimulatedBest enter-one |
| Personal knowledge / second brain | Pages = memory; hop0 = attention now |
| Agent memory systems | Contrast chat resume vs process re-enter |

Add 2–3 peer-reviewed tool-use / agent memory papers at submit (venue-dependent).

## Lab primary sources (this tree)

| Path | Role |
|------|------|
| `docs/ABSTRACT.md` | workshop abstract cut |
| `docs/THESIS.md` | full draft |
| `docs/REPRO.md` | reproduce measures |
| `docs/measures_latest.json` | dump |
| `docs/hop0_latest.txt` | hop0 sample |
| living-core `research_skills_vs_mcp.md` | MCP vs skills law |
| living-core `research_jfactor_lab.md` | lab index |
| living-core `operate_runtime.md` | kernel wire |

## Freeze checklist (before arXiv)

- [x] MCP + Skills + Grok Build primary URLs dated  
- [ ] Confirm agentskills.io / docs.x.ai live at submit day  
- [ ] Add DOI/venue for final arXiv companions  
- [ ] Re-run `node scripts/dump_measures.js` and paste numbers  
