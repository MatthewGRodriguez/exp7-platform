# Joys (JWorkbook (ranking_ui project))

**This project owns joys and jmethods.**  
**living-core** is a separate project: talk to it to *author* packages here (discover, insert, refine). living-core does not vendor these as its source of truth.

## Layout

```
joys/
  index.json          # catalog living-core maintains
  <joy_id>/
    MANIFEST.json     # id, title, polarity, relates_to, status
    jmethod.js        # browser-safe: score(ctx) → number
    HOW.md            # densest: expected use
    RESEARCH.md       # optional notes
views/
  <view_id>.md        # use-vs-expected and other surfaces
```

## MANIFEST.json

```json
{
  "id": "joy_money",
  "title": "Money",
  "polarity": "cost",
  "status": "probe",
  "relates_to": ["joy_happy", "joy_debt"],
  "methods": ["score"],
  "author": "living-core",
  "at": "ISO-8601"
}
```

## jmethod.js

Must assign a global or `module.exports` with:

```js
function score(ctx) { /* … */ return number; }
if (typeof module !== 'undefined') module.exports = { score: score, id: 'joy_money' };
if (typeof window !== 'undefined') {
  window.RankingJoys = window.RankingJoys || {};
  window.RankingJoys.joy_money = { score: score };
}
```

## living-core bridge

From living-core MCP / runtime:

- `living_ranking` action=`status|list|write_joy|write_view|index`
- Default path: sibling `legacy/legacy/html` (override `RANKING_UI_ROOT`)
