# JEditor

JEditor is a UI-driven editor, like a level designer, whose saved "level" output is a single self-contained HTML file app. It will be used to build things like ranking_ui, the G1 calculator, and the training day designer. No external data for now.

## Docs
- `docs/legacy-reference/` holds the original JFactor and Exp6 docs (plus `tdd-animation/`: TDD motion engine + workflow copied 2026-10-30 from the box `/workspace/td/pipeline2`, `/workspace/td/ux`, `/workspace/jeditor_inputs`), copied (unmodified) on 2026-10-30 from:
  - `~/Home/Dev/The Joy Machine 2/docs/api/` -> `jfactor/api/` (canonical JFactor API reference)
  - `~/Home/Dev/The Joy Machine 2/.cursor/rules/jfactor-api.mdc` -> `jfactor/cursor-rules/`
  - `~/Home/Dev/The Joy Machine 2/jfactor-lab/{README.md,AGENTS.md,docs/}` -> `exp6/jfactor-lab/` (Exp6 thesis/architecture/paper/repro)
- New JEditor docs go in `docs/` (`design/`, `spec/`, `decisions/`).

## How we version: Lore (standalone)
JEditor uses its own Lore VCS server, independent of any other project.

- CLI: `~/.local/bin/lore` · server binary: `~/.local/bin/loreserver`
- Repo: `jeditor`, remote `lore://127.0.0.1:41437` (set in `.lore/config.toml`, identity `jeditor@joy.local`); ignores in `.loreignore`
- Server dir: `~/Home/Dev/JEditor-lore-server/` (`store/` data, `config/local.toml`, `loreserver.log`)
- Ports: gRPC/QUIC 41437, HTTP 41439 (health: `curl -i http://127.0.0.1:41439/health_check`)
- Auto-start: launchd agent `~/Library/LaunchAgents/local.jeditor.loreserver.plist` (label `local.jeditor.loreserver`, RunAtLoad + KeepAlive)

Server control:
```
launchctl print gui/$(id -u)/local.jeditor.loreserver          # status
launchctl kickstart -k gui/$(id -u)/local.jeditor.loreserver   # restart
launchctl bootout gui/$(id -u)/local.jeditor.loreserver        # stop (until next bootstrap/login)
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/local.jeditor.loreserver.plist  # start
# remove: bootout, then delete the plist (data in ~/Home/Dev/JEditor-lore-server stays)
```
Everyday loop:
```
lore status
lore stage . --scan && lore commit "msg" && lore push
lore history
```
