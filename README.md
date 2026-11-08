# exp7-platform

Software-only public repository for Exp7 Platform release artifacts.

- **Personal data** lives in a separate user-owned repository (not here).
- **Launcher sign-in** uses a fine-grained personal-repo key for that data repo; it does not need write permission on this software repo.
- Release layout: `exp7-platform/release.json` (manifest) and `exp7-platform/exp7-platform-lean.html` (payload).

## Documentation

Project notes (requirements, architecture, lineage, gaps vs live `main`) live under [`docs/`](./docs/README.md). A **historical public-safe** Lore snapshot (158 docs; not complete/latest) lives under [`docs/lore/`](./docs/lore/README.md) — see [`docs/lore-migration-pending.md`](./docs/lore-migration-pending.md).

Documentation PRs must not change release HTML or `release.json`.
