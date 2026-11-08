# exp7-platform

Software-only public repository for Exp7 Platform release artifacts.

- **Personal data** lives in a separate user-owned repository (not here).
- **Launcher sign-in** uses a fine-grained personal-repo key for that data repo; it does not need write permission on this software repo.
- Release layout: `exp7-platform/release.json` (manifest) and `exp7-platform/exp7-platform-lean.html` (payload).
- Current candidate: **1.2.2** — Exp7 mounts **directly in-page (no iframe)**. The GitHub PAT/token stays in the shell script closure only (never globals/DOM/storage/app payload). Load/inject alone is not success; shell waits for render-ready handshake.
