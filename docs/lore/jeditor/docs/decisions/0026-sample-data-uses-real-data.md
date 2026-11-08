# ADR 0026: v1 sample data uses real data
Status: decided (2026-10-30). The data-private/.loreignore proposal below is superseded by ADR 0027 (real data is committed).
Decision (Matthew: "use my real data, not anonymized"): the v1 ranking_ui level uses Matthew's real data from ranking_ui (`vendor/workbook_local.json` and related files), not anonymized. Where real data does not cover something, the 21 KB `workbook_data.json` base fills the gap.
Consequences:
- A saved level embeds this data, so its output HTML contains personal data and is private. Level metadata flag: `meta.containsPersonalData: true` (doc 03).
- No real data files are copied into the repo yet (this ADR is docs only).
- Proposal (not decided): real-data files live in `JEditor/data-private/`, listed in `.[REDACTED-ACCESS-DETAIL] Whether to commit real data to Lore is an open question (doc 05).
