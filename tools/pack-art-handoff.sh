#!/usr/bin/env bash
# Build self-contained ART-PIPELINE-HANDOFF archive (no .git, no secrets).
# Publishes to /opt/cursor/artifacts; does NOT leave unpacked trees for the PR.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="${ART_HANDOFF_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
NAME="ART-PIPELINE-HANDOFF-${STAMP}"
OUT_DIR="$ROOT/artifacts/art-ux-profile-2026-11-08/handoff"
TOOL_ART="${CURSOR_ARTIFACTS:-/opt/cursor/artifacts}"
STAGE="$OUT_DIR/$NAME"
rm -rf "$STAGE"
mkdir -p "$STAGE" "$TOOL_ART/handoff-history"

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
if [ -d "$ROOT/artifacts/art-ux-profile-2026-11-08/contact-sheets" ]; then
  copy_tree "$ROOT/artifacts/art-ux-profile-2026-11-08/contact-sheets" "$STAGE/contact-sheets"
fi
if [ -d "$ROOT/artifacts/art-ux-profile-2026-11-08/perspective" ]; then
  copy_tree "$ROOT/artifacts/art-ux-profile-2026-11-08/perspective" "$STAGE/perspective-results"
fi
for f in ACCEPTANCE-MATRIX.md PRODUCTION-DELTA.md VERSION-MANIFEST.json; do
  [ -f "$ROOT/artifacts/art-ux-profile-2026-11-08/$f" ] && cp -f "$ROOT/artifacts/art-ux-profile-2026-11-08/$f" "$STAGE/$f"
done

find "$STAGE" -type f \( -name '*.pem' -o -name '*token*' -o -name '*.env' \) -delete 2>/dev/null || true
find "$STAGE" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find "$STAGE" -type f -name '*.pyc' -delete 2>/dev/null || true

cat > "$STAGE/README.md" <<EOF
# $NAME

Generator: **front-readable-v6** — unlit flat text (no extrude/ghost); content-aware framing;
pixel gates; light=params 9m/4.2m; shadow-cal invisible caster; Moho loop **PASS** (no more loop work).
Cloud ortho ≠ METAL predictor. Still not full visual QA. Do not merge/promote.

Mac: \`--probe --only views\` then full; \`--only shadow\` emits \`shadow_cal_lift_*\`.
EOF

(
  cd "$OUT_DIR"
  find "$NAME" -type f | sort > "$NAME/MANIFEST.txt"
  tar -czf "${NAME}.tar.gz" "$NAME"
  sha256sum "${NAME}.tar.gz" | tee "${NAME}.tar.gz.sha256"
)

SHA=$(cut -d' ' -f1 "$OUT_DIR/${NAME}.tar.gz.sha256")
# Publish to tool artifacts; keep history of prior tarballs
cp -f "$OUT_DIR/${NAME}.tar.gz" "$TOOL_ART/"
cp -f "$OUT_DIR/${NAME}.tar.gz.sha256" "$TOOL_ART/"
# Move any older repo tarballs into history before deleting from PR tree
for old in "$OUT_DIR"/ART-PIPELINE-HANDOFF-*.tar.gz; do
  [ -f "$old" ] || continue
  base=$(basename "$old")
  if [ "$base" != "${NAME}.tar.gz" ]; then
    cp -f "$old" "$TOOL_ART/handoff-history/" 2>/dev/null || true
    cp -f "${old}.sha256" "$TOOL_ART/handoff-history/" 2>/dev/null || true
  fi
done

cat > "$OUT_DIR/LATEST.txt" <<EOF
archive=${NAME}.tar.gz
sha256=${SHA}
tool_artifacts=${TOOL_ART}/${NAME}.tar.gz
history=${TOOL_ART}/handoff-history/
generator_rev=front-readable-v6
scratch=/Users/user-rodri/ArtScratch/exp7-art
note=Authoritative archive in tool artifacts; PR keeps sources + VERSION-MANIFEST + concise qa only.
EOF
cp -f "$OUT_DIR/LATEST.txt" "$TOOL_ART/ART-PIPELINE-HANDOFF-LATEST.txt"
cp -f "$ROOT/artifacts/art-ux-profile-2026-11-08/VERSION-MANIFEST.json" "$TOOL_ART/" 2>/dev/null || true
cp -f "$ROOT/artifacts/art-ux-profile-2026-11-08/ACCEPTANCE-MATRIX.md" "$TOOL_ART/" 2>/dev/null || true

# Drop unpacked stage + tarball from repo tree (reviewable PR)
rm -rf "$STAGE"
# Keep LATEST only in handoff/; move current tar exclusively to tool artifacts
mv -f "$OUT_DIR/${NAME}.tar.gz" "$TOOL_ART/${NAME}.tar.gz"
mv -f "$OUT_DIR/${NAME}.tar.gz.sha256" "$TOOL_ART/${NAME}.tar.gz.sha256"
# Remove any leftover tarballs/unpacked from handoff dir
rm -rf "$OUT_DIR"/ART-PIPELINE-HANDOFF-*

echo "HANDOFF ${TOOL_ART}/${NAME}.tar.gz"
echo "sha256 ${SHA}"
