# Known issues and acceptance criteria

Intended to prevent recurrence of failures already seen.

| Failure mode | Acceptance criterion |
|--------------|----------------------|
| “Done” based on jsdom, mocks, or cloud browsers | Rendering/UX acceptance = Matthew’s Mac run **[USER-HW]**. Label every other result. |
| Box browser preview for Exp7 | Do not rely on it (loopback policy / no GPU). Deliver HTML for Safari. Do not bypass policy/flags/proxies. |
| Register that does nothing (invalid nested control) | Real control + handler; same-tab GitHub; Back resumes; test bindings. |
| Release PRs with unrelated files/dirs | Diff = `release.json` + platform HTML only (**except** authorized docs-only PR). |
| Avatar + fallback both visible; chrome overlaying app | Exclusive fallback; **reserved** fixed header; screenshot from Matthew’s device. |
| Substitute Budget views | Budget **must** reuse actual Exp7 Cal/Board/Plan (`exp7-views@1`). |
| Iframe embedding | Direct in-page load only. |
| Shared unscoped IndexedDB leaking another account’s ops | Per account+repo+client namespacing; immutable op ownership. |
| Multi-file user install | One small launcher HTML; platform is one HTML release payload. |
| Resuming canceled search/scheduler | Do not, unless Matthew asks again. |
| Inferring repo state from PR descriptions | Verify `main` commit + files directly. |
| Claiming full app sync | Only claim what is implemented (today: Exp7 proposal-ops; Budget local). |
| Mixing docs into app/release PRs | Prefer separate documentation PR. |
| Contacting Artist without authorization | Forbidden unless Matthew authorizes. **Authorized 2026-11-08:** Ash Tangent Residual Artist for view art workflow + profile images — [artist-coordination-brief.md](./artist-coordination-brief.md). |
| Secrets in docs, logs, or commits | Never. PAT never in JRender canvas text. |
| Doubled Budget tabs (DOM + JR) | When JR paints, hide DOM via `#budgetRoot.jr-chrome` + inline `!important`; never rely on `html`/`body` selectors under `scopeAppCss`. |
| Plan tab missing Cal/Board/Plan controls | Apply `budgetChromeDoc` **after** `planDoc`. |
| Upper bar clicks offset from paint | When `jr-on`, JR **canvas** takes pointer hits; do not leave opaque DOM hit targets misaligned with JR layout. |
| Cloud VM `no-adapter` treated as product failure | Expected without GPU; DOM / `.jrerr` fallback. Mac Safari is acceptance. |

## Outstanding product gaps relative to [REQ]

See [requirements-vs-main.md](./requirements-vs-main.md). Headline gaps on verified **1.8.3** `main`:

1. Mac **[USER-HW]** acceptance of parallax chrome + multi-board Budget (not done in cloud).  
2. Application-level sync remains **incomplete** (honesty required).  
3. Account / share panel still DOM (acceptable while PAT-safe; optional future JR).  
4. GPU/performance QA never done.

Historical 1.5.0 gaps (stub Budget, transparent overlay chrome) are **closed** on tip — do not re-open them as current.
