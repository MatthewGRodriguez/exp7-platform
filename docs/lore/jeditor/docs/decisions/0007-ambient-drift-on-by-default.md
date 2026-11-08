# ADR 0007: Background drift on by default
Status: decided (2026-10-30)
Decision: the ambient background drift (slow loop on depth layers only, as in the TDD engine: periods ~31 s / 23 s, amplitude ~4 / 3 px; glass lighting stays static) is ON by default in every level, with a per-level switch (`motion.ambient.enabled`) to turn it off. It still turns off under reduced motion and pauses on a hidden tab.
See docs/design/02 and 03.
