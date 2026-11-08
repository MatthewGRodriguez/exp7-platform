# Historical Lore archive vs current requirements

Archived Lore docs are **not** silently edited to match later rules. Where they disagree with newer Matthew requirements (handoff / platform docs), **newer requirements win** for product work. Conflicts stay visible here.

Evidence: archive = historical snapshot **[PENDING completeness]**; platform requirements = [REQ] in handoff + `docs/`; live code = verified `main` in [`../requirements-vs-main.md`](../requirements-vs-main.md).

## Precedence

1. Explicit newer user requirements (handoff 2026-11-08 and later instructions)  
2. Verified public `main` behavior (what is actually shipped)  
3. This Lore archive (design ≤49, ADR ≤0111, living-core top-level)  
4. Agent claims / closed PRs  

## Known tensions (not resolved by rewriting archive bytes)

| Topic | Historical archive may say / imply | Current rule / state |
|-------|------------------------------------|----------------------|
| Budget / ranking UI | JEditor ADRs and design docs describe calendar/board/plan and ranking_ui evolution inside editor/world models | Platform **Budget** must use **real Exp7** Cal/Board/Plan; tip **1.8.3** does (`exp7-views@1`) — archive does not “cause” that; do not treat Lore import as the fix |
| Joy vs money | Older samples and some reports use money-shaped examples | Call ranked stocks **joys**; units are not automatically dollars [REQ] |
| Outside-process sync (e.g. design 47) | Broader connection / sync design direction | Platform today: Exp7 **proposal-ops** only; Budget local; full app sync **incomplete** — do not claim archive = shipped sync |
| Search / planner / scheduler | Experiments and reports may appear in design lineage | **Canceled** 2026-11-07 — do not resume from archive text |
| Atlas / world naming | ADR/design series on atlas rename and verse-like circuits | Direction accepted historically; Artist coordination / renames still gated — **no Artist contact** without authorization |
| JRender / WebGPU | Priority ADRs for workers/WebGPU | Still: real JRender only, no fallback renderer; WASI 0.3 not done; box GPU often unavailable |
| Chrome / platform shell | Largely absent from this JEditor-centric snapshot | Reserved header, exclusive avatar, no iframe, software≠data, JRViews chrome + Exp7Slabs — platform [REQ]/[MEAS] on `main` 1.8.3; see `docs/platform-chrome-jrender.md` |
| Completeness | — | Design after **49**, ADR after **0111**, and other Mac Lore docs **not** in archive |

## What this file is not

- Not a merge of Lore into implementation  
- Not permission to change `release.json` or platform HTML  
- Not a claim that the 158-file set is the full Lore corpus  
