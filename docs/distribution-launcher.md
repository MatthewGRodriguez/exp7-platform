# Distribution and launcher

## Software vs data [REQ]

| Repo | Role |
|------|------|
| `MatthewGRodriguez/exp7-platform` | **Software / release** only (`release.json` + platform HTML) |
| User-owned public data repo (often `exp7-app-data`) | Personal Exp7 proposal ops / data — **never** overwritten by software updates |

Release format: `exp7-platform-release/1` with `version`, `file`, `sha256`, `minLauncherMajor` (+ optional `contains` metadata).

**Release PR rule [REQ]:** diff limited to those two release files — **except** an explicitly authorized documentation-only PR (this tree).

## Launcher requirements [REQ]

- One small HTML file; **embeds no platform**.  
- Fixed source: owner / repo / `main` / `release.json` — no visible source config, file pickers, or manual manifest install in the happy path.  
- **Gate:** masked key box + Register only. Paste / Enter / typing pause triggers check.  
- Fetch release **read-only without the key**, commit-pin, SHA-256 verify.  
- Cache in IndexedDB: current + previous; offline last-working fallback.  
- On success: gate disappears; platform fills the window.  
- **Key handoff:** in-memory same-window `postMessage`; platform accepts once, only if `e.source === window`, within ~15 s.  
- **Allow** a key that can also write the software repo, with a note in the status line (since launcher change 2026-11-10; it used to refuse one). A key that can create the data repo usually has that access. The launcher reads the platform without the key, pinned to a commit and checked against `release.json`, so the key is never used on the software repo.

## Launcher variants (branch `budget-direction`, 1.8.60; not merged) [REQ 2026-11-11]

| File | Opens | Other apps reachable |
|---|---|---|
| `launcher/exp7-launcher.html` | Last app, with the app picker and Back to it | Yes. Unchanged. |
| `launcher/budget-launcher.html` | Budget | No |
| `launcher/demo-launcher.html` | Demo | No |

- The dedicated launchers are generated from the universal launcher and differ only in the title, an About line, and the launch step.
- A dedicated launcher sets `window.__exp7Launch = {app, only: true}` before it writes the platform. It refuses a platform older than 1.8.60, which could not honour the limit, and closes the page if the platform does not acknowledge it (`window.__exp7LaunchAck`).
- The platform applies the limit where apps mount, so it holds for navigation routes and not only for visible buttons: the picker, the saved last app, app routes and direct mounts are refused and recorded as `app_boundary`.
- Back still works inside the app (Budget: day, month, Home) and stops there.
- Checked with the real launcher files and platform in a cloud browser; the release read from GitHub was a test double **[MOCK]**. Fetching the real release, and Safari, are **[OPEN]**.
- These are two new files outside the two-file release rule. See [budget-direction.md](./budget-direction.md).

## Register flow (historical fix on Grok Bot box) [MOCK / OPEN]

Handoff reports the 7 055 B launcher had an invalid nested Register control (`button` inside `a`, no handler). A fix restored Atlas-sync-style **same-tab** navigation to GitHub fine-grained PAT creation, with a non-secret pending flag in sessionStorage and focus return on Back.

- Deliverable path cited: `/workspace/deliver/exp7-launcher-register-fix/` (Grok Bot box index only).  
- Size/SHA cited in handoff; mocks 31/31 against 1.2 / 1.3 candidates **[MOCK]**.  
- **Real browser, partial [MEAS 2026-11-09]:** gate, key messages, sign-in, IndexedDB cache, one-shot handoff and offline fallback checked in Chromium on Matthew’s Mac ([mac-test-2026-11-09.md](./mac-test-2026-11-09.md)). Write-key refusal and the Register→Back flow still **[OPEN]**; Safari **[USER-HW][OPEN]**.  
- **In this repo since PR #59 (merged 2026-11-10):** [`launcher/exp7-launcher.html`](../launcher/exp7-launcher.html), **8,351 B**, SHA-256 `5bbe061d67a1dca9926f9f72aef261d57d0dc55db81db20b2ab9c7be89a15cc8` **[MEAS]**. Size and SHA prefix match the Register-fix deliverable above, so this is that file. Edit the launcher there; it is not part of `release.json`.

## Public fetch spot-check [MEAS 2026-11-08]

`GET https://raw.githubusercontent.com/MatthewGRodriguez/exp7-platform/main/exp7-platform/release.json` → HTTP **200**, body matches git `origin/main` **1.8.3** manifest (SHA `2033acab…`; CORS/`Access-Control-Allow-Origin` not re-validated in this docs pass; earlier 1.2.0 handoff noted `*` [MEAS historical]).

## Platform ↔ launcher compatibility

Verified `main` shell documents launcher handoff acceptance (one-shot, sign-out must not silently reuse stale handoff). Full end-to-end launcher→platform on Matthew’s Safari remains **[USER-HW] / [OPEN]** for current **1.8.3** pairing with whatever launcher file he actually opens.
