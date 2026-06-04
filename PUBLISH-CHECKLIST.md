# Publish checklist — getsqe.com (website)

This repo is built locally and **not yet pushed**. Before going live:

## 1. GitHub (manual)
- [ ] Create the free `getsqe` GitHub org.
- [ ] `gh repo create getsqe/www --public --source . --remote origin` (from this dir), then `git push -u origin main`.
- [ ] Repo → Settings → Pages → Source = **GitHub Actions**.
- [ ] Repo → Settings → Pages → Custom domain = `getsqe.com` (the committed `public/CNAME` also sets this).

## 2. Cloudflare DNS (manual)
| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `getsqe.com` (`@`) | `getsqe.github.io` | DNS only (grey) |
| CNAME | `www` | `getsqe.github.io` | DNS only (grey) |

- [ ] SSL/TLS mode **Full**; start DNS-only so GitHub provisions Let's Encrypt.
- [ ] After certs issue: enable **Enforce HTTPS** in repo Pages settings; optionally turn on the orange-cloud proxy.

## 3. Ebook downloads — BLOCKED (publish-safety)
The PDF/EPUB at `docs/ebook/build/` in the private SQE repo (built 2026-05-15) **contain unsanitized content**: a real-looking AWS account id (`311141556126`), `eu-central/west` regions, `amazonaws` endpoints, and internal crate paths. The text leak-gate **cannot scan binaries**, so these are deliberately **gitignored** (`public/downloads/*.pdf|*.epub`) and the download buttons on `/ebook` are disabled. Read-online chapters are sanitized and safe.

To re-enable downloads:
- [ ] Sanitize the **book source** in the private repo (`docs/ebook/chapters/*.md`, `metadata.yaml`, `diagrams/`) — same redactions the website sync applies.
- [ ] Rebuild artifacts (`cd docs/ebook && make`) with a LaTeX engine (xelatex/weasyprint) + diagram renderers (d2/mmdc) installed.
- [ ] Verify clean: `pdftotext sovereign-by-design.pdf - | grep -E '311141556126|eu-(central|west)|amazonaws'` returns nothing; same for the unzipped EPUB.
- [ ] Drop the `public/downloads/*.pdf|*.epub` lines from `.gitignore`, run `npm run sync`, and restore the download buttons in `src/pages/ebook/index.astro`.

## 4. Content refresh
- [ ] `npm run sync` re-pulls + re-sanitizes from `$SQE` and runs the blocking leak gate. Never hand-author claims.
- [ ] Eyeball the read-online chapters (`src/content/ebook/*.md`) before upload: they are Jacob's prose with **mechanical** sanitizer edits (e.g. `ACCOUNT_ID`, "the sqe-catalog crate", "a feature branch"). Smooth any awkward artifacts by hand.

### Note on the leak gate's guarantee
The **real** safety guarantee is the gate over the **synced source markdown** (run inside `sync-from-sqe.sh`, returns 0 before any build). The `dist/` scan in CI is a *backstop with known holes*: Shiki splits identifiers across `<span>`s so a contiguous `crates/sqe-` inside a highlighted code block may not match; and the glob skips `.js` and binaries. Treat a clean source scan — not a clean dist scan — as the gate that matters.

## Curated / hand-authored pages (NOT raw-synced)
- **`src/pages/compare/duckdb.astro`** is curated: it keeps the differentiators, a
  "DuckDB-inspired, now in SQE" feature resume, and the genuine remaining gaps — dropping the
  source doc's "done" changelog/roadmap rows. Facts are derived from `src/content/compare/duckdb.md`
  (still synced + gate-scanned, but no longer rendered raw). **Update this page by hand** when the
  DuckDB comparison source changes — `npm run sync` will not.
- **`src/pages/about.astro`** intentionally credits **Schuberg Philis** and the authors
  (Jacob Verhoeks & Rafael Herrero) and frames the sovereign-data-platform vision — a deliberate
  divergence from the spec's "no SBP naming" rule, per direct request. SBP naming stays out of the
  nav/footer *chrome*; it lives in About page content only.
- The sync sanitizer also strips Pandoc heading attributes (`{#sec:…}`) the ebook chapters carry,
  since Astro renders them literally. Note: Pandoc cross-reference links (`](#sec:…)`) in chapters
  point at anchors that don't exist in the web render — a minor read-online limitation.

## Verified locally (2026-06-04)
- `astro build` → 31 pages, exit 0.
- `bash scripts/leak-scan.sh dist` → **0 hits**.
- Routes, CNAME (`getsqe.com`), favicon, og-image all present.
