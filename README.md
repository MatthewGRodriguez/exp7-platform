# exp7-platform

Software-only public repository for Exp7 Platform release artifacts.

- **Personal data** lives in a separate user-owned repository (not here).
- **Launcher sign-in** uses a fine-grained personal-repo key for that data repo; it does not need write permission on this software repo.
- Release layout: `exp7-platform/release.json` (manifest) and `exp7-platform/exp7-platform-lean.html` (payload).

## Documentation

Project notes and **historical archives** live under [`docs/`](./docs/README.md): Lore (`docs/lore/`, 158 public-safe + 41 redacted; not complete/latest) and sanitized ranking_ui (`docs/archives/ranking_ui/`). See [`docs/lore-migration-pending.md`](./docs/lore-migration-pending.md).

Docs/archive PRs must not change release HTML or `release.json`, and must not commit raw private sources.
