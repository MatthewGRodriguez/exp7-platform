# living-core

## Try it

Clone, smoke, then `simulatedBest` — that is the first-run a local clone opens. Discord notify is optional and later.

```bash
git clone https://github.com/MatthewGRodriguez/grok-bot-living-ceo.git
cd grok-bot-living-ceo
node scripts/smoke.js
node -e "var rt=require('./src/runtime').createRuntime({rootDir:process.cwd()}); var s=rt.simulatedBest('ceo_next'); console.log('STRANGER_OK', s.top && s.top.id, 'n', (s.ranked||[]).length);"
```

Ash glance: http://127.0.0.1:8766/ceo_face.html (docs/ceo_face.html; docs/ceo_face.json; not ranking_ui :8765)
Serve ash glance: bash scripts/ceo-face-serve.sh then http://127.0.0.1:8766/ceo_face.html
Heal starts ash glance: bash scripts/ensure-living-infra.sh starts :8766 when down
Glance/notify face-up: Discord exo notify includes face_up (whether http://127.0.0.1:8766/ceo_face.html is 200)
Try-it curl: `curl -sS -m 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:8766/ceo_face.html` (expect 200)
Try-it json glance: `python3 -c "import json; print(json.load(open('docs/ceo_face.json')).get('best'))"` shows best_title
Try-it curl json: `curl -sS -m 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:8766/ceo_face.json` (expect 200)
Ash glance heading: docs/ceo_face.html h1 is the next-act sentence
Ash glance unfinished: docs/ceo_face.html shows unfinished idea count
Ash glance presence: docs/ceo_face.html shows presence AWAY/HERE
Ash glance Best: docs/ceo_face.html shows Best / best_title
Ash glance remaining: docs/ceo_face.html shows remaining
Ash glance play_intent: docs/ceo_face.html shows play_intent true/false
Ash glance j_raw: docs/ceo_face.html shows j_raw
Ash glance act: docs/ceo_face.html shows act

Needs Node >= 18. Discord notify is optional and later:

```bash
python3 scripts/ceo-discord-notify.py test
```

Without a webhook that fails cleanly. Never print or commit webhook URLs.

Fresh living process core. **Grok is always the outer author.** Host runs Exp6 ranking + modality lifecycle. MCP lives here.

## Carry-in
- `vendor/exp6/` — JFactor Exp6 (+ wasm/workers)

## Bootstrap modalities
1. **`host`** — computer execution environment  
2. **`data`** — attention-packed durable store (child of host)

## Rank pipeline
```
sense → SimulatedBest → explore → Best(enter top) → sample → graduate?
```

- **j** = blend(author prior, outcome samples)  
- **Best** scores all simulated, enters **only the winner** for real I/O  
- **Graduation** (`living_graduate`) can refuse even when j is high  

## Bootstrap tree
```
host
 ├── data
 │    ├── pages      (store/pages densest)
 │    ├── exports    (store/exports index)
 │    └── samples    (sample JSONL trim)
 ├── research
 ├── crystallize
 └── craft
```

Layer-local j: `j = j_share = j_raw/sum`, also `j_n = j_raw/n`. Rank nested: `living_rank_cycle` with `parent: "data"`.

## Mac surface (apps / CLIs as tools — peripheral)
Explore surfaces capabilities, allowlisted CLIs, and `/Applications` apps — **not** auto-installed.

| Step | Tool | Effect |
|------|------|--------|
| Discover | `living_explore` | `app:*`, `cli:*`, `cap:*` candidates |
| Author probe | `living_scaffold_probe` | writes `modalities/<id>/` (status `probe`) |
| Rank | `living_rank_cycle` | multi-child Best + sample |
| Samples | `living_samples` | outcome stats / recent rows |
| Graduate | `living_graduate` | evaluate / apply status step |
| Revoke | `living_revoke` | noise control; leave jgroup |
| Audit | `living_audit` | graduate/revoke snapshot |
| Densify | `living_densify` | collapse EXTERNALS/RESEARCH bloat |
| Use tool | `living_invoke` | intentional open/CLI; prefer `dry_run` |

**Judge:** Best uses parent-goal evidence for `did_help` (not self-report alone).

Probe Best only **verifies** presence — it does not surprise-open apps.

JMethod contract:
```js
function (x, y, jX, jY, jgroup) {
  if (jgroup.simulated) return effectiveness(...) // no world side effects
  doWork(...)
  return effectiveness(...)
}
```

## Run
```bash
cd living-core
node scripts/smoke.js     # SimulatedBest → explore → Best
npm run mcp               # HTTP MCP :3850
npm run mcp:stdio         # stdio MCP (Grok/Cursor)
```

## MCP (living-core as project root)

| Path | Role |
|------|------|
| `mcp/stdio.js` | stdio MCP server |
| `mcp/http.js` | HTTP MCP (`POST /mcp`) |
| `mcp/tools.js` | tool catalog + dispatch |
| `.grok/config.toml` | Grok: `[mcp_servers.living]` |
| `.cursor/mcp.json` | Cursor MCP config |

Open **living-core** as the workspace root so Grok/Cursor load these configs.

## Design
See parent `docs/DESIGN_PROMPT_v3_modality_fresh_repo.md`.
