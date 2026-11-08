# ADR 0083: Templates copy once; delete always works and leaves broken references

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- **Template:** creating from a template is a one-time deep copy with a new id. There is no link back and no record of where it came from. Any world record can serve as a template (`World.copy`), and the editor also offers a few built-in starters.
- **Delete** is always allowed (`World.remove`).
  - Records that pointed at the deleted one are left untouched. Those references become **broken**: `World.refs(world)` lists every reference with `broken:true|false`.
  - The editor marks broken references in red, and the page skips them.
- **Supersedes ADR 0052's "warn / keep / delete-and-unwire" delete protection.**
