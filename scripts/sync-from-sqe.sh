#!/usr/bin/env bash
# Sync getsqe.com website content FROM the private SQE repo.
# Run manually on demand. Nothing here touches the source repo (read-only).
#
#   SQE_DIR=/path/to/sqe bash scripts/sync-from-sqe.sh
#
# Steps:
#   1. Copy the three comparison docs -> src/content/compare/
#   2. Copy ebook chapters -> src/content/ebook/ and PDF/EPUB -> public/downloads/
#   3. Run the publishable-subset filter on iceberg-matrix-state.json
#   4. Run the BLOCKING leak-scan gate over everything staged for publish.
#      Any hit aborts the sync (exit 1) — nothing is published until sanitized.
set -euo pipefail

SQE_DIR="${SQE_DIR:-/Users/jjverhoeks/git/schuberg/vpf-data-ai/chameleon/Applications/sqlengine}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -d "$SQE_DIR" ]]; then
  echo "ERROR: SQE_DIR not found: $SQE_DIR" >&2
  exit 1
fi

echo "→ syncing from $SQE_DIR"

# --- 1. comparison docs -----------------------------------------------------
mkdir -p "$HERE/src/content/compare"
cp "$SQE_DIR/docs/trino-compatibility.md"  "$HERE/src/content/compare/trino.md"
cp "$SQE_DIR/docs/duckdb-comparision.md"   "$HERE/src/content/compare/duckdb.md"
cp "$SQE_DIR/docs/features.md"             "$HERE/src/content/compare/features.md"

# --- 2. ebook chapters + artifacts ------------------------------------------
mkdir -p "$HERE/src/content/ebook" "$HERE/public/downloads"
rm -f "$HERE/src/content/ebook"/*.md
cp "$SQE_DIR/docs/ebook/chapters/"*.md "$HERE/src/content/ebook/"
# Diagrams referenced by chapters (relative paths resolve from the md location).
mkdir -p "$HERE/src/content/ebook/diagrams/rendered"
cp "$SQE_DIR/docs/ebook/diagrams/rendered/"*.svg "$HERE/src/content/ebook/diagrams/rendered/" 2>/dev/null || echo "  (warn: no rendered svgs)"
cp "$SQE_DIR/docs/ebook/build/sovereign-by-design.pdf"  "$HERE/public/downloads/" 2>/dev/null || echo "  (warn: pdf not found)"
cp "$SQE_DIR/docs/ebook/build/sovereign-by-design.epub" "$HERE/public/downloads/" 2>/dev/null || echo "  (warn: epub not found)"

# --- 3. matrix filter -------------------------------------------------------
mkdir -p "$HERE/src/data"
node "$HERE/scripts/filter-matrix.mjs" \
  "$SQE_DIR/docs/iceberg-matrix-state.json" \
  "$HERE/src/data/iceberg-matrix.json"

# --- 3b. sanitize synced copies (deterministic, re-run safe) ----------------
# Redacts internal detail from the SYNCED COPIES only (source untouched).
# Designed to preserve readability: internal crate paths become human module
# names, account ids / regions / endpoints become placeholders. Public crate
# names (sqe-cli, sqe-coordinator) are not introduced here and are allowlisted
# by the gate below.
echo "→ sanitizing synced copies"
SANITIZE_FILES=()
while IFS= read -r -d '' f; do SANITIZE_FILES+=("$f"); done < <(
  find "$HERE/src/content/compare" "$HERE/src/content/ebook" -type f -name '*.md' -print0
)
sed -i '' \
  -e 's#`crates/\(sqe-[a-z][a-z-]*\)[^`]*`#the \1 crate#g' \
  -e 's#crates/\(sqe-[a-z][a-z-]*\)/[^ )`"]*#the \1 module#g' \
  -e 's#[0-9]\{12\}#ACCOUNT_ID#g' \
  -e 's#eu-central-[0-9]#eu-example-1#g' \
  -e 's#eu-west-[0-9]#eu-example-1#g' \
  -e 's#glue\.[a-z0-9<>-]*\.amazonaws\.com#<glue-endpoint>#g' \
  -e 's#amazonaws#aws#g' \
  -e 's#MR ![0-9][0-9]*#an earlier change#g' \
  -e 's#feat/[A-Za-z0-9._-][A-Za-z0-9._-]*#a feature branch#g' \
  -e 's#chore/[A-Za-z0-9._-][A-Za-z0-9._-]*#a maintenance branch#g' \
  "${SANITIZE_FILES[@]}"

# --- 4. leak-scan gate (BLOCKING) -------------------------------------------
# Delegates to the shared gate (single source of truth, also run in CI).
# Any hit aborts the sync — nothing is published until the copies are sanitized.
echo "→ leak-scan gate over staged publish files"
bash "$HERE/scripts/leak-scan.sh" \
  "$HERE/src/content/compare" \
  "$HERE/src/content/ebook" \
  "$HERE/src/data/iceberg-matrix.json"

echo "✓ sync OK"
