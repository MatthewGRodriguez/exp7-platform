# Known issues and acceptance criteria

Intended to prevent recurrence of failures already seen.

| Failure mode | Acceptance criterion |
|--------------|----------------------|
| “Done” based on jsdom, mocks, or cloud browsers | Rendering/UX acceptance = Matthew’s Mac run **[USER-HW]**. Label every other result. |
| Box browser preview for Exp7 | Do not rely on it (loopback policy / no GPU). Deliver HTML for Safari. Do not bypass policy/flags/proxies. |
| Register that does nothing (invalid nested control) | Real control + handler; same-tab GitHub; Back resumes; test bindings. |
| Release PRs with unrelated files/dirs | Diff = `release.json` + platform HTML only (**except** authorized docs-only PR). |
| Avatar + fallback both visible; chrome overlaying app | Exclusive fallback; **reserved** fixed header; screenshot from Matthew’s device. |
| Substitute Budget views | Budget **must** reuse actual Exp7 Cal/Board/Plan view code (`calHtml` / `boardHtml` / plan+`depsHtml`). |
| Iframe embedding | Direct in-page load only. |
| Shared unscoped IndexedDB leaking another account’s ops | Per account+repo+client namespacing; immutable op ownership. |
| Multi-file user install | One small launcher HTML; platform is one HTML release payload. |
| Resuming canceled search/scheduler | Do not, unless Matthew asks again. |
| Inferring repo state from PR descriptions | Verify `main` commit + files directly. |
| Claiming full app sync | Only claim what is implemented (today: Exp7 proposal-ops; Budget local). |
| Mixing docs into app/release PRs | Separate documentation PR. |
| Contacting Artist without authorization | Forbidden until Matthew authorizes. |
| Secrets in docs, logs, or commits | Never. |

## Outstanding product gaps relative to [REQ]

See the full matrix in [requirements-vs-main.md](./requirements-vs-main.md). Headline gaps on verified **1.5.0** `main`:

1. Budget is a **stub**, not real Exp7 views.  
2. Top chrome is a **transparent overlay**, not the required reserved solid bar.  
3. Avatar exclusivity CSS pattern required by later corrections is **not** present as the exclusive `.is-on` gate described in handoff/agent follow-ups.  
4. Application-level sync remains **incomplete** (honesty required).
