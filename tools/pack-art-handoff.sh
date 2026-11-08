#!/usr/bin/env bash
# Build self-contained ART-PIPELINE-HANDOFF archive (no .git, no secrets).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="${ART_HANDOFF_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
NAME="ART-PIPELINE-HANDOFF-${STAMP}"
OUT_DIR="$ROOT/artifacts/art-ux-profile-2026-11-08/handoff"
STAGE="$OUT_DIR/$NAME"
rm -rf "$STAGE"
mkdir -p "$STAGE"

copy_tree() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp -a "$src" "$dst"
}

copy_tree "$ROOT/art/design" "$STAGE/art/design"
copy_tree "$ROOT/art/api" "$STAGE/art/api"
copy_tree "$ROOT/art/lighting" "$STAGE/art/lighting"
copy_tree "$ROOT/art/perspective" "$STAGE/art/perspective"
copy_tree "$ROOT/art/pipeline" "$STAGE/art/pipeline"
copy_tree "$ROOT/art/src" "$STAGE/art/src"
copy_tree "$ROOT/tests" "$STAGE/tests"
copy_tree "$ROOT/tools/pack-art-lean.mjs" "$STAGE/tools/pack-art-lean.mjs"
copy_tree "$ROOT/artifacts/art-ux-profile-2026-11-08/qa" "$STAGE/qa"
copy_tree "$ROOT/artifacts/art-ux-profile-2026-11-08/contact-sheets" "$STAGE/contact-sheets"
copy_tree "$ROOT/artifacts/art-ux-profile-2026-11-08/perspective" "$STAGE/perspective-results"

# Strip secrets + bytecode
find "$STAGE" -type f \( -name '*.pem' -o -name '*token*' -o -name '*.env' \) -delete 2>/dev/null || true
find "$STAGE" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find "$STAGE" -type f -name '*.pyc' -delete 2>/dev/null || true

cat > "$STAGE/README.md" <<EOF
# $NAME

Self-contained Exp7 art pipeline handoff. **No .git. No PATs/keys.**

Generator: **front-readable-v3** (contour rings, JRViews washes, shadow+surface pairs, Cal/Board/Plan/chrome views).
Fail evidence: \`qa/mac-fail-20261108T1045/\` (slivers), \`qa/mac-fail-v2-20261108/\` (torus rings / global-mean).
Moho form A/B **VERIFIED** on Mac 14.3 — document path first.

Mac scratch root: \`/Users/user-rodri/ArtScratch/exp7-art/<stage>\`

## Start here
1. Read \`art/pipeline/mac/MAC_RUNBOOK.md\` (Moho verified commands first after unpack)
2. Read \`qa/GATE-MATRIX.md\`
3. Blender: \`generate_ui_scene.py\` stage \`ui-states-v3\` + \`measure_roi.py\` (not global mean)
4. Moho: \`Moho <abs seed> <abs script.lua>\` / \`-r\` — then comparison/animate/render
5. Analytical \`art/lighting/fits.json\` stays **provisional** until shadow-catcher fit

Do not clone software repos onto the Mac for this probe; use this archive only.
CI green does **not** mean visual QA pass. Still not a full art QA pass.
EOF

# Manifest
(
  cd "$OUT_DIR"
  find "$NAME" -type f | sort > "$NAME/MANIFEST.txt"
  tar -czf "${NAME}.tar.gz" "$NAME"
  sha256sum "${NAME}.tar.gz" | tee "${NAME}.tar.gz.sha256"
  # also copy sha into artifacts root note
  ls -la "${NAME}.tar.gz"
)

# Pointer file for coordinator
cat > "$OUT_DIR/LATEST.txt" <<EOF
archive=${NAME}.tar.gz
sha256=$(cut -d' ' -f1 "$OUT_DIR/${NAME}.tar.gz.sha256")
path=artifacts/art-ux-profile-2026-11-08/handoff/${NAME}.tar.gz
scratch=/Users/user-rodri/ArtScratch/exp7-art
EOF

echo "HANDOFF $OUT_DIR/${NAME}.tar.gz"
