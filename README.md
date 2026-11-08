# exp7-platform

Software-only public repository for Exp7 Platform release artifacts.

- **Personal data** lives in a separate user-owned repository (not here).
- **Launcher sign-in** uses a fine-grained personal-repo key for that data repo; it does not need write permission on this software repo.
- Release layout: `exp7-platform/release.json` (manifest) and `exp7-platform/exp7-platform-lean.html` (payload).
- Current release: **1.2.1** (Open-app render-ready handshake; diagnostics plaintext fallback; sandbox remains `allow-scripts` only).
