#!/usr/bin/env node
// Publish-safety filter A — Iceberg matrix.
//
// The source `iceberg-matrix-state.json` carries internal detail that MUST NOT
// be published: AWS account ids, internal branch names, MR numbers, vendor fork
// commits, and per-cell `evidence` citing internal crate/test paths.
//
// This emits a NEW json containing ONLY publishable fields:
//   - score { raw, max, percent }
//   - docUrl  (public GitHub URL only)
//   - cells[] { key, feature, version, level }   (label derived from key, never notes)
//
// Dropped entirely: note, generatedBy, generatedAt, platform.vendor,
// support[cell].notes / .evidence / .caveats, $schema/sourceRubric internals.
//
// Usage: node scripts/filter-matrix.mjs <src.json> <out.json>

import { readFileSync, writeFileSync } from 'node:fs';

const [, , srcPath, outPath] = process.argv;
if (!srcPath || !outPath) {
  console.error('usage: filter-matrix.mjs <src.json> <out.json>');
  process.exit(2);
}

const src = JSON.parse(readFileSync(srcPath, 'utf8'));

// Only the public GitHub URL is allowed through from platform.
const PUBLIC_DOC_URL = 'https://github.com/schubergphilis/sqe';
const docUrl =
  typeof src?.platform?.docUrl === 'string' && src.platform.docUrl.startsWith('https://github.com/')
    ? src.platform.docUrl
    : PUBLIC_DOC_URL;

function deriveLabel(key) {
  // key shape: "sqe:position-deletes:v2"
  const parts = String(key).split(':');
  const slug = parts.length >= 2 ? parts[1] : key;
  const version = parts.length >= 3 ? parts[2].toUpperCase() : '';
  const words = slug.replace(/-/g, ' ').trim();
  const feature = words.charAt(0).toUpperCase() + words.slice(1);
  return { feature, version };
}

const ALLOWED_LEVELS = new Set(['full', 'partial', 'none']);

const cells = Object.entries(src.support ?? {})
  .map(([key, cell]) => {
    const { feature, version } = deriveLabel(key);
    const level = ALLOWED_LEVELS.has(cell?.level) ? cell.level : 'none';
    return { key, feature, version, level };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const out = {
  score: {
    raw: src.score?.raw ?? 0,
    max: src.score?.max ?? 0,
    percent: src.score?.percent ?? 0,
  },
  docUrl,
  cells,
};

writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log(
  `filter-matrix: ${cells.length} cells, score ${out.score.raw}/${out.score.max} (${out.score.percent}%) -> ${outPath}`,
);
