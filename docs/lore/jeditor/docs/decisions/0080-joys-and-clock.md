# ADR 0080: Joys are world records; the clock is a joy on a tick

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- Joy record: `{id, name, value}`. Joys are shared by name and never instanced. Blueprints read them with joy nodes and write them with the joy node's `add` (delta) or `set` input.
- **The clock is an ordinary world joy.** `world.clock = {joy:"clock", ms:1000, on:true}`. On each tick the page adds +1 to that joy as a delta write, and the blueprints that read it become dirty (ADR 0084).
- Supersedes ADR 0052 for new work (joy override chains, derive libraries, delete protection; delete protection is replaced by ADR 0083). It stays for legacy levels.
