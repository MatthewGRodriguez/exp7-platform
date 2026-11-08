# Testing provenance and limits

## Philosophy [REQ]

- Standalone / device verdicts come from **Matthew’s hardware** (Safari; he does not use Chrome for this).  
- Box / cloud / jsdom results must be **labeled separately**.  
- Results must **never** include keys.  
- Prefer Copy-results + selectable text fallback on standalone harnesses (historical).

## What different environments can prove

| Environment | Can support | Cannot prove |
|-------------|-------------|--------------|
| jsdom / node harnesses | Parsing, pure functions, some IDB mocks | Pixels, WebGPU, Safari UX |
| CPU GPU command recorder | That draw lists were issued | Real adapter performance / visual fidelity |
| Cloud / VM headless Chromium or WebKit | DOM geometry, some interaction scripts | Matthew’s Mac acceptance; often no WebGPU adapter |
| Managed box Chrome | Often blocked (`LoopbackNetworkBlockedForUrls`) | Localhost Exp7 preview |
| Matthew’s Mac Safari | Rendering / UX acceptance | — |

## Indexed local evidence (Grok Bot box — not on Cursor VM)

Handoff §10 lists deliverable folders under `/workspace/deliver/...` (standalone tests, platform v1, lean, launcher, jrender coverage). **Those paths are an index only** unless the files are attached to this environment. Do not cite them as in-repo artifacts.

## Claims vs acceptance

| Report | Class | Acceptance? |
|--------|-------|-------------|
| Lean jsdom 16/16 | [MOCK] | No visual accept |
| Platform v1 “29/29” | [MOCK] | No |
| Launcher register-fix mocks 31/31 | [MOCK] | No; real browser [OPEN] |
| Cursor/cloud PR #7 “tests passed” | [CLAIM]/[MOCK] | **No** — PR closed; not on `main`; awaiting Matthew |
| Matthew v13 visual accept | [USER-HW] | Demo motion line only; not platform 1.5.0 Budget/chrome |
| Matthew: launcher picked up update; Exp7 renders direct (post–PR3 manual) | [USER-HW] | Rendering only — not persistence/editing/GPU QA |

## Known measurement gaps [OPEN]

- Register fix + handoff in real Safari  
- GitHub unauthenticated rate limits (60/hour/IP) under real launcher use  
- Mobile / Safari WebGPU  
- Full app-level sync (beyond proposal ops), conflict/ownership defaults  
- Budget per-joy share UX details (range labeling, finance-tab ↔ Board mapping) when real views land  
- GPU/performance QA (never done)
