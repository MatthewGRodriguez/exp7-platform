<!--
Provenance: uploaded historical handoff used to seed docs/ (2026-11-08).
This file is an archive. It is NOT automatically true of current main.
Live verification lives in docs/README.md and docs/requirements-vs-main.md.
Local /workspace/deliver/... paths index Grok Bot's box; they are not in this repo.
-->

# Exp7 / JFactor context handoff (for repo documentation)

Prepared 2026-11-08 CST by Grok Bot for the existing Cursor agent. It draws on conversation context, durable memory (own and shared), and local coverage/test documents on Grok Bot's computer.

**Purpose:** documentation only. Turn this into repo notes/docs in a **separate documentation-only PR**. Make no release, app, platform or manifest changes, and do not merge or publish. This is a newly authorized exception to the usual "two release files only" diff rule (see §9). Do not commit user-uploaded HTML. This file holds no secrets, keys, account or financial data.

**Evidence labels used throughout:**
- **[REQ]** a requirement Matthew stated (date where known)
- **[MEAS]** measured on Grok Bot's box, or on public endpoints by exact HTTP
- **[USER-HW]** Matthew's report from his own Mac or hardware
- **[MOCK]** jsdom, fake IndexedDB, mocked GitHub, a CPU recorder or a VM: *not* visual, GPU or real-device proof
- **[CLAIM]** reported by a Cursor or cloud agent and not independently verified
- **[OPEN]** unresolved

---

## 1. Foundations (scope limited to what records support)
- **living-core**: Matthew's main project, "The Joy Machine 2". Its key engines are **Exp6** (optimization/ranking: `Best`/`SimulatedBest`, JWorld, JGroups) and **Exotelos** (open-ended creativity / intention lifting; it never overrides debt or REVIEW). The canonical CEO tree was snapshotted to the box (Lore 0.8.5, living MCP); the Mac copy may drift. [REQ/historical]
- **JFactor**: the factor and ranking model. A "Joy" is a ranked stock such as energy, attention or a calendar seat. Exp6's sample identifier is `money`, which is why joys get misread as cash. When the ranked thing is a calendar, budget or schedule, call it *joy*, not money. [REQ 2026-08-13]
- JFactor performs best on larger non-atomic JGroups, where whole scenarios are tested in one `Best` call. Independently originated ideas can become native JFactor mechanisms through its JS "fake polymorphism". [REQ 2026-11-07]
- **Lore VCS** is used instead of git for Matthew's own projects (no `git init`). JEditor has its own standalone Lore setup. The GitHub repos below are the exception, used for distribution and data. [REQ 2026-10-30]
- **ranking_ui** (the older system) uses harmonic shares as dimension scores: `(1/rank)/Σ(1/k)` over on-factor items. Large factor pots dilute the #1 item to roughly 25–29%, and marking items non-factor shrinks the pot. A Board-best-equals-1000 remap was used for display. Unit-mismatch lessons: compare ideal and actual in the same quantity, or as X=input, Y=score(). [historical, 2026-09]
- **Atlas** is the Exp7 data container name (it replaced "world", which clashed with Exp6's JWorld). The binary codec is `atlas/1` (JRBA magic); its binary log is 3.6–5.3× smaller than JSON. Exp7 moved from node circuits toward a Verse-like text circuit language, v0 (syntax open). [REQ 2026-11-02]
- **Outside-process connection**: per-writer public GitHub repos, REST only, one log per writer, last write wins (design doc 47). [REQ 2026-11-02]

## 2. JRender and the Artist
- JRender, the renderer by the Ash Tangent Residual Artist agent, is part of Exp7. All views are drawn by the real JRender, never a reimplementation. There is **no fallback renderer**: without WebGPU or the Wasm, show a plain error with diagnostics. [REQ 2026-11-03]
- WebGPU (and, as a goal, WASI 0.3, not wasip2) are assumed supported for target users. The shipped path today is core wasm (`wasm32-unknown-unknown`, 0 imports) with a thin JS host. A WASI 0.3 migration is not done. [REQ 2026-11-06; MEAS per EXP7_JRENDER_COMPARE.md]
- Light theme with transparent backgrounds; panels and text must stay readable. [REQ 2026-11-06]
- **Coordination**: Matthew wants to coordinate with the Artist eventually. **No message to the Artist is authorized right now.** Storage-related changes were to wait on the Artist's update (2026-11-02). Renames need to happen in sync with the Artist's codec naming.

## 3. Exp7 demo version history (local files on Grok Bot's box)
- **v13** (motion) was accepted on 2026-11-06 at 23:30 CST on **Matthew's own visual verification** [USER-HW]. Detailed GPU/performance QA was never done [OPEN].
  - Box QA for motion-v12/v13 used a CPU-only GPU command recorder; the "Box GPU adapter is unavailable" (see `deliver/jrender-exp7/*/COVERAGE.md`) [MOCK].
- **v14** light; **v15** experimental views (Matrix, What-if, Dependency graph, Ownership timeline); **v16**; **v17** local collaborative editing:
  - RGA notes, LWW label, movable order, own-intent undo, binary log exchange.
  - Local only: not durable, not authenticated.
- **v18–v20** add planner/scheduler-only experiments. v20 = v17 plus planner scripts.
- **Lean build (2026-11-07)**: based on v17, keeping the v17 editing and removing the experimental views, planner tab, scheduler and planner seed. Core scripts 0–18 are byte-identical.
  - The lean app is 1,487,141 B (v17 is 1,532,837 B). Lean jsdom tests 16/16 [MOCK].
- **Search/scheduler research is CANCELED.** On 2026-11-07 Matthew said: "forget about the search. stop here. What we have is what we have." Do not resume search optimization, benchmarks or the Timefold comparison, including the canceled "v50" research line. Search may not even be a main Exp7 feature. [REQ]

## 4. Platform and distribution (2026-11-07 → 08)
- **[REQ]** The platform shell is part of Exp7: key entry, offline storage, GitHub sharing and app updates. App updates are separate from user data.
- **[REQ]** The **software/release repo and the personal data repo are separate**. Updates never overwrite personal data.
- **Software repo**: public `MatthewGRodriguez/exp7-platform`; release at `main:exp7-platform/release.json` (format `exp7-platform-release/1`: version, file, sha256, minLauncherMajor).
  - Release 1.2.0 went live after **PR1 was merged by Matthew** (merge commit `12f3f4d7…`). The exact public API sequence (commit → manifest → raw HTML, 2,023,596 B, SHA matches) was verified with HTTP 200, `Access-Control-Allow-Origin: *`, no auth and no redirects [MEAS]. That check was not done in a browser.
- **PR3 was NOT merged.** Matthew closed it and **manually committed only `release.json` and the platform HTML**. He reports the launcher picked up the update and Exp7 renders on his Mac with direct in-page loading, not an iframe [USER-HW: rendering only, not persistence/editing/GPU QA].
- **Release diff rule [REQ]**: release changes are limited to the manifest and the actual platform HTML. No unrelated files or added directories.
- **Launcher [REQ]**: a single small HTML file that embeds **no platform**. The source is fixed: owner/repo/main/release.json, with no visible source config, file pickers or manual manifest install.
  - **Gate**: only a masked key box and Register. Paste, Enter or a typing pause triggers the check.
  - **Download and cache**: the release is fetched read-only without the key, commit-pinned and SHA-256 verified. It is cached in IndexedDB as current plus previous, with offline last-working fallback.
  - **On success**: the gate disappears completely and the platform fills the window.
  - **Key handoff**: the key passes in memory via a same-window `postMessage` that the platform accepts once, only from `e.source===window`, within 15 s.
  - **Key-scope check**: a key that can write to the software repo is refused.
- **Register fix (2026-11-08)** [MOCK only]: the delivered 7,055 B launcher's Register was a `<button tabindex=-1>` nested inside `<a target=_blank>`, with no handler. It was invalid, couldn't be reached by keyboard, and silently did nothing where new tabs from a file page are blocked.
  - Restored the **original Atlas sync flow** from the first real GitHub tests (`embedded/clients/client.html`). Register navigates the **same tab** to `https://github.com/settings/personal-access-tokens/new?name=Atlas%20sync&description=Static%20page%20access&expires_in=30&contents=write`, stores only a non-secret pending flag in sessionStorage, and on Back shows "paste the key" with the key box focused.
  - Deliverable: `/workspace/deliver/exp7-launcher-register-fix/exp7-platform.html`, **8,351 B**, SHA `5bbe061d…`. Mocks 31/31 against both the 1.2.0 platform and the 1.3 platform candidate. **Not yet verified in a real browser** [OPEN].
- **Platform 1.3 candidate**: shell 1.3.0, DB `exp7-platform-app-v1`, default data repo `exp7-app-data`. It is compatible with the launcher handoff protocol (checked statically and in mocks).

## 5. Latest product requirements (2026-11-08) [REQ]
- **Default app on first load, then the last opened app.** There are no app-chooser headings.
- **Chrome**: only a top-left back arrow that reveals app buttons, and to its right a **GitHub avatar icon**. The **whole avatar is the button** and opens sharing, sign-out and account controls.
  - The fallback icon is **exclusive**: show the avatar *or* the fallback, never both overlapping.
  - The chrome sits in a **reserved fixed header bar that never overlays the app**.
  - The workspace-setup section and testing info do not appear as user chrome.
- **No iframe**: Exp7 loads directly in the platform page.
- **Budget app** (Matthew's name for it):
  - It uses the **real Exp7 Calendar, Board and Plan views** (no substitutes), with the Board adapted for expenses, income, debt and assets, plus finance tabs.
  - It has **optional per-ranking-joy harmonic normalized shares over an arbitrary range**. Units are **not automatically dollars**: a joy's unit is whatever that joy measures.
- **Sync**: automatic at the application level is the requirement. It is **incomplete**: platform 1.3 syncs proposal ops only. Do not claim full app sync.
  - Cross-device sync is treated as "good enough / assumed" by Matthew (2026-11-07). It has not been measured.
- **Testing philosophy**: standalone tests run on Matthew's actual hardware, with a Copy-results button plus a selectable text fallback. Device verdicts come only from his runs, and box results are labelled separately. Results must never include keys.
- **Working mode history**: Matthew requested local implementation after repeated incorrect Cursor results. His latest instruction authorizes Cursor again, starting with documentation. Current scope is documentation only; no implementation work is authorized by this handoff.

## 6. Security and secret rules [REQ]
- The key lives in session memory only. It never goes into IndexedDB, localStorage, sessionStorage, logs, reports, URLs, globals, DOM (beyond the masked input) or any child frame.
- **Clear the input immediately** after reading it.
- **Validate read-only** against GitHub `/user` and the user's own public personal data repo.
- **Network**: `api.github.com` only, with `credentials:'omit'`. Redirects are refused, and release reads are unauthenticated and commit-pinned. No proxy and no OAuth backend.
- **Historical diagnostic write safeguards**: standalone tests used explicit buttons and narrowly reserved/create-only paths. Do not confuse that bounded test protocol with the later requirement for automatic application-level sync. Preserve original databases and unrelated public files; document current write behavior separately and flag unresolved migration/ownership rules.
- **Trust limit**: a checksum proves the file matches the manifest, not who published it. Whoever can push to the software repo controls the code that receives keys, so recommend branch protection and 2FA.
- **Never fabricate**: no fake pass results, hosted releases or presets, and no visual/Mac/GitHub results claimed from mocks.

## 7. Cursor and cloud claims (unverified)
- **PR7 / "1.6"** claimed real shared views and the fixed header [CLAIM]. It is **not accepted**: there is no Mac proof, and the avatar fix is unconfirmed.
- **Latest `main` must be verified directly** (read the commit SHA and files), never inferred from PR text or an agent summary.

## 8. Repeated failures and acceptance criteria (to prevent recurrence)
| Failure seen | Acceptance criterion |
|---|---|
| Claims of done or working based on jsdom, mocks or cloud browsers | Rendering/UX acceptance = Matthew's own Mac run [USER-HW]. Label every result by evidence class. |
| Box browser preview attempts: localhost is blocked by the managed Chrome policy `LoopbackNetworkBlockedForUrls:["*"]`, and the box has no GPU adapter | Do not use box browser previews for Exp7 visuals. Deliver the single HTML to Matthew's Mac and have him open it in Safari (he doesn't use Chrome). Do not bypass the policy, flags or proxies. |
| Register button that did nothing (invalid nested anchor) | Real `<button>` with a handler and visible progress/error. Same-tab GitHub page; Back resumes. Test the bindings. |
| Release PRs carrying unrelated files or directories | Diff = `release.json` + platform HTML only (except this docs-only PR). |
| Avatar plus fallback overlapping; chrome overlaying the app | Exclusive fallback; reserved fixed header; check with a screenshot from Matthew's device. |
| Substitute views instead of real Exp7 Cal/Board/Plan | Budget must reuse the actual Exp7 view code. |
| Iframe embedding | Direct in-page load. |
| Shared unscoped IndexedDB between same-origin windows (Test05 v1 published another account's ops) | Per account+repo+client namespacing; immutable op ownership. |
| Multi-file installs | One small launcher HTML for the user. The platform is one HTML release payload. |
| Resuming canceled search/scheduler research | Do not resume unless Matthew asks again. |
| Inferring repo state from PR descriptions | Verify `main` directly. |

## 9. Documentation PR rules
- **Allowed**: a separate PR that only adds or changes documentation (e.g. `docs/`).
- **Not allowed**: release, platform, launcher or app changes; merging or publishing; committing user-uploaded HTML (Matthew previously declined uploading it).
- Matthew decides on merging.

## 10. Local evidence index (Grok Bot's box, not in the repo)
- `/workspace/deliver/exp7-standalone-tests/`: tests 01–05 and 05v2, PROTOCOL.md.
- `/workspace/deliver/exp7-platform-v1/`: platform v1, RELEASE-FORMAT.md, HOW-TO-TEST.md (dev tests 29/29 [MOCK]).
- `/workspace/deliver/exp7-platform-lean/`: the lean build and README.
- `/workspace/deliver/exp7-platform-launch/`: launcher 1.0 (7,055 B) and the 1.2.0 upload files.
- `/workspace/deliver/exp7-launcher-register-fix/`: the Register fix and its README.
- `/workspace/deliver/jrender-exp7/*/COVERAGE.md`, `EXP7_JRENDER_COMPARE.md`: renderer QA scope and gaps.
- The accepted demo is `/workspace/deliver/exp7-demo/exp7-demo.html` (keep byte-exact).

## 11. Open questions and evidence gaps
- What is the current repo `main` SHA and which platform version is live? (1.3? Matthew's manual commits came after 1.2.0.) Verify directly.
- No transcript records are available for Nov 7–8 (stored transcript ends 2026-11-07 00:35). Details since then come from conversation context and memory.
- Real-browser checks of the Register fix and of the handoff; GitHub rate limits (60 unauthenticated requests/hour/IP); mobile/Safari WebGPU.
- Full app-level sync design (beyond proposal ops); conflict and ownership defaults ("last accepted writer owns the path", to be confirmed).
- Budget per-joy share semantics: per-joy range configuration, how units are labelled, and how finance tabs map to Board categories.
- The WASI 0.3 component host path; GPU/performance QA (never done).
