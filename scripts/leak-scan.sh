#!/usr/bin/env bash
# Shared publish-safety leak gate. Single source of truth for the sync script
# and the deploy workflow.
#
#   scripts/leak-scan.sh <dir-or-file> [<dir-or-file> ...]
#
# Scans *.md / *.json / *.html under the given paths. Public crate paths
# (sqe-cli, sqe-coordinator) are allowlisted: they appear in the public README
# and must NOT count as leaks. Exits 1 on any hit (prints file:line), 0 if clean.
set -euo pipefail

# jacobadmin/jacobbuilder matched specifically (NOT bare "jacob") so the author
# byline "Jacob Verhoeks" in blog/ebook content is not a false hit.
# The 12-digit account-id rule is boundary-anchored so it does not substring-match
# inside longer digit runs (e.g. 19-digit Iceberg snapshot ids). The canonical
# placeholder account ids 123456789012 / 000000000000 are allowlisted (stripped).
LEAK_RE='(^|[^0-9])[0-9]{12}([^0-9]|$)|chore/|feat/|crates/sqe-|eu-(central|west)|amazonaws|MR !|sbp\.gitlab|gitlab\.schubergphilis|vpf-data-ai|jacobadmin|jacobbuilder'
ALLOWLIST_SED='s#crates/sqe-cli##g; s#crates/sqe-coordinator##g; s#123456789012##g; s#000000000000##g'

if [[ $# -eq 0 ]]; then
  echo "usage: leak-scan.sh <dir-or-file> ..." >&2
  exit 2
fi

hits=0
while IFS= read -r -d '' f; do
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    echo "  LEAK: $f: $line"
    hits=$((hits + 1))
  done < <(sed "$ALLOWLIST_SED" "$f" | grep -nEi "$LEAK_RE" || true)
done < <(find "$@" -type f \( -name '*.md' -o -name '*.json' -o -name '*.html' -o -name '*.svg' \) -print0)

if [[ "$hits" -gt 0 ]]; then
  echo "leak-scan: $hits hit(s) — ABORT" >&2
  exit 1
fi
echo "leak-scan: clean (0 hits)"
