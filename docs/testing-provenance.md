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
| Cloud / VM headless Chromium | DOM geometry, act routing, boot without syntax errors; usually **`no-adapter`** | Matthew’s Mac acceptance; Exp7Slabs parallax paint |
| Managed box Chrome | Often blocked (`LoopbackNetworkBlockedForUrls`) | Localhost Exp7 preview |
| Claude desktop built-in browser on Matthew’s Mac (Chromium 152) | Real Apple Metal WebGPU adapter, JRender paint, hits, parallax, frame time ([mac-test-2026-11-09.md](./mac-test-2026-11-09.md)) | Safari acceptance |
| Matthew’s Mac Safari | Rendering / UX / parallax acceptance | — |

## Indexed local evidence (Grok Bot box — not on Cursor VM)

Handoff §10 lists deliverable folders under `/workspace/deliver/...`. **Those paths are an index only** unless attached here. Do not cite them as in-repo artifacts.

## Claims vs acceptance

| Report | Class | Acceptance? |
|--------|-------|-------------|
| Lean / platform CDP smoke on cloud VM | [MOCK] | Boot + DOM routing only; `no-adapter` expected |
| “PlatformChromeJR active: false” on VM | [MEAS] | Correct without GPU — not a Mac fail |
| PR CI green | [CLAIM]/process | Necessary, not Mac UX acceptance |
| Matthew v13 visual accept | [USER-HW] | Demo motion line; pre-platform-1.8 chrome |
| Matthew: launcher picked up update; Exp7 renders direct | [USER-HW] | Rendering only — not persistence/editing/GPU QA |
| 1.8.3 parallax + bar hits on Mac | [USER-HW] | **Still required** **[OPEN]** |
| 1.8.31 WebGPU paint, hits, parallax, 60 Hz frame time on Matthew’s Mac, Chromium in the Claude app ([mac-test-2026-11-09.md](./mac-test-2026-11-09.md)) | [MEAS] | Real-GPU evidence; **not** Safari acceptance |

## Known measurement gaps [OPEN]

- Register fix + handoff in real Safari  
- GitHub unauthenticated rate limits (60/hour/IP) under real launcher use  
- Mobile / Safari WebGPU  
- Full app-level sync (beyond proposal ops), conflict/ownership defaults  
- **Mac USER-HW:** Exp7Slabs parallax on bar, apps picker, Budget in-scene tabs; bar hit alignment; four Board panes  
- GPU/performance QA (never done)
