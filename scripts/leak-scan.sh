#!/usr/bin/env bash
# Shared publish-safety leak gate. Single source of truth for the sync script
# and the deploy workflow.
#
#   scripts/leak-scan.sh <dir-or-file> [<dir-or-file> ...]
#
# Scans every text extension we publish (see SCAN_EXTS) under the given paths.
# Public crate paths (sqe-cli, sqe-coordinator) are allowlisted: they appear in
# the public README and must NOT count as leaks. Exits 1 on any hit (prints
# file:line), 0 if clean.
#
# On the extension list: .js matters because generated SEARCH INDEXES are
# JavaScript, and they embed the full text of every page. An HTML-only scan
# passes while the index still carries a leaked string that the site's own
# search box will happily surface. Same reasoning for .xml (sitemaps) and .txt.
set -euo pipefail

# Text extensions that reach the published output. Keep in sync across the
# three site gates; a gap here is silent.
# `sh` matters: the sync scripts live in this PUBLIC repo, and one of them
# carried the maintainer's absolute checkout path for months without any gate
# ever reading it — no gate scanned shell scripts.
SCAN_EXTS=(md mdx json html svg js mjs xml txt yml yaml css sh)

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

# Build the find expression: \( -name '*.md' -o -name '*.mdx' -o ... \)
find_expr=()
for ext in "${SCAN_EXTS[@]}"; do
  [[ ${#find_expr[@]} -eq 0 ]] || find_expr+=(-o)
  find_expr+=(-name "*.${ext}")
done

hits=0
scanned=0
while IFS= read -r -d '' f; do
  scanned=$((scanned + 1))
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    echo "  LEAK: $f: $line"
    hits=$((hits + 1))
  done < <(sed "$ALLOWLIST_SED" "$f" | grep -nEi "$LEAK_RE" || true)
done < <(find "$@" -type f \( "${find_expr[@]}" \) -print0)

if [[ "$hits" -gt 0 ]]; then
  echo "leak-scan: $hits hit(s) — ABORT" >&2
  exit 1
fi

# A scan that matched nothing is indistinguishable from a clean one in the
# output, and a wrong path is an easy mistake. Refuse to report "clean" for it.
if [[ "$scanned" -eq 0 ]]; then
  echo "leak-scan: matched 0 files under: $* — refusing to report clean" >&2
  exit 2
fi
echo "leak-scan: clean (0 hits, $scanned files)"
