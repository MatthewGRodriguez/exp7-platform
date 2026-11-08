# Foundations

Scope limited to what records support. Historical; not a claim that every subsystem is shipped in `exp7-platform` `main`.

## Living-core / Joy Machine 2 [REQ / historical]

Matthew’s main project (“The Joy Machine 2”) centers on:

- **Exp6** — optimization / ranking (`Best` / `SimulatedBest`, JWorld, JGroups).  
- **Exotelos** — open-ended creativity / intention lifting; it must not override debt or REVIEW.

A CEO tree snapshot existed in Lore (noted as Lore 0.8.5 / living MCP in handoff). Mac copies may drift. **[OPEN]** whether any of that tree is mirrored in this GitHub repo (it is not, as of verified `main`).

## JFactor [REQ 2026-08-13, 2026-11-07]

- A **Joy** is a ranked stock (energy, attention, calendar seat, etc.).  
- Exp6’s sample identifier `money` causes people to misread joys as cash. When the ranked thing is calendar / budget / schedule, call it **joy**, not money.  
- JFactor performs best on larger non-atomic JGroups (whole scenarios in one `Best` call).  
- Independently originated ideas can become native mechanisms via JS “fake polymorphism.”

## ranking_ui harmonic shares [historical 2026-09]

Older ranking_ui used harmonic shares as dimension scores: \((1/\mathrm{rank})/\sum(1/k)\) over **on-factor** items. Large pots dilute #1 (~25–29%); marking items non-factor shrinks the pot. Display sometimes remapped Board-best to 1000. Lesson: compare ideal vs actual in the **same quantity**, or X=input, Y=score().

Budget product requirements reuse this share idea optionally **per ranking joy**, over an arbitrary range — units are **not** automatically dollars. [REQ 2026-11-08]

## Lore VCS vs GitHub [REQ 2026-10-30]

- Matthew’s own projects normally use **Lore VCS** (no `git init`).  
- JEditor has its own Lore setup.  
- **Exception:** public GitHub repos for **distribution** (software) and **personal data** (user-owned).  
- Bringing remaining Lore docs into this repo is **[PENDING]** — see [lore-migration-pending.md](./lore-migration-pending.md).

## Atlas [REQ 2026-11-02]

- **Atlas** is Exp7’s data container name (replaced “world”, which clashed with Exp6 JWorld).  
- Binary codec `atlas/1` (JRBA magic); binary log reported ~3.6–5.3× smaller than JSON (historical measure; re-verify if quoting sizes).  
- Direction of travel: from node circuits toward a Verse-like **text circuit language** (v0, syntax open).

## Outside-process connection [REQ 2026-11-02]

Design direction (design doc 47 in Lore history, not necessarily in this repo yet):

- Per-writer **public** GitHub repos  
- REST only  
- One log per writer  
- Last-write-wins at the connection layer  

Platform sync on `main` today implements a **narrower** automatic path (Exp7 proposal-ops). See [architecture.md](./architecture.md) and [requirements-vs-main.md](./requirements-vs-main.md).
