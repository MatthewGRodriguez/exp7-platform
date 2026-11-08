# Lore archive (historical snapshot)

**Not** a complete or latest canonical Lore migration.

Documents here are **historical data**. Newer user requirements in the handoff / `docs/` notes take precedence when they conflict. Unresolved conflicts stay listed — archive bytes are not silently “corrected” into policy.

## What is here

| Item | Count |
|------|------:|
| Public-safe documents (byte-exact to first package) | **158** |
| Redacted supplement (transformed copies; original paths) | **41** |
| Still withheld entirely (personal income/pay decision) | **1** (not present; not reconstructed) |
| Prior withhold bucket (before redacted package) | **42** = 41 redacted + 1 still withheld |

### Layout (original relative paths preserved)

```
docs/lore/
  LORE-DOCS-PUBLIC-INVENTORY.md      # 158 public-safe + SHA-256
  LORE-DOCS-REDACTED-INVENTORY.md    # 41 redacted: original → package → repo tidy SHAs
  REDACTED-SUPPLEMENT.md
  HISTORICAL-VS-CURRENT.md
  jeditor/                           # design ≤49, ADRs ≤0111 (+ redacted paths mixed in)
  living-core/
```

### Hash verification

- Public-safe **158/158** match package inventory (bytes + SHA-256).  
- Redacted **41/41** present; repo SHA column reflects post-tidy content; **8** files differ from package_redacted SHA solely due to placeholder tidy (no private values restored).  

### Freshness / source gaps

- No Lore history / freshness guarantee.  
- Box restore timestamps ~2026-11-07 00:35 CST; copy date unknown.  
- Design ≤ **49**, ADR ≤ **0111**; later Mac docs unknown.  
- Authoritative Lore remains on the owner’s Mac.

## How to use

1. Background / provenance only.  
2. Current platform rules: [`../requirements-vs-main.md`](../requirements-vs-main.md).  
3. Conflicts: [`HISTORICAL-VS-CURRENT.md`](./HISTORICAL-VS-CURRENT.md).  
4. Do **not** resume canceled search/scheduler research from older designs.
