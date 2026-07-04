#!/usr/bin/env node
// Aggregate the SQE benchmark result JSONs into a compact, cleaned time-series
// the website can chart. Reads every <resultsDir>/*.json and produces, per
// suite -> scale, the BEST clean full-suite run per DAY (transient up-spikes
// removed) — a representative downward trend, not raw noise. See the reduction
// comment below for the exact rules.
//
//   node scripts/aggregate-benchmarks.mjs <resultsDir> <outFile>
//
// Result JSON shape: { benchmark, scale_factor, timestamp,
//   summary: { total, pass, total_duration_ms, ... }, queries: [ { status, duration_ms } ] }
// Pure timing data — no secrets — but the synced output is still leak-gated.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [, , resultsDir, outFile] = process.argv;
if (!resultsDir || !outFile) {
  console.error('usage: aggregate-benchmarks.mjs <resultsDir> <outFile>');
  process.exit(2);
}

const scaleKey = (sf) => {
  const n = Number(sf);
  if (Number.isInteger(n)) return String(n);
  return String(n); // 0.1, 0.01 stay as-is
};

const suites = {};
let files = 0;
for (const name of readdirSync(resultsDir)) {
  if (!name.endsWith('.json')) continue;
  // skip the SQE-vs-Trino "compare-*" files; this series is SQE run duration over time
  if (name.startsWith('compare-')) continue;
  let d;
  try { d = JSON.parse(readFileSync(join(resultsDir, name), 'utf8')); }
  catch { continue; }
  const suite = d.benchmark;
  const ts = d.timestamp;
  if (!suite || !ts || d.scale_factor == null) continue;
  files++;

  const s = d.summary || {};
  let totalMs = typeof s.total_duration_ms === 'number' ? s.total_duration_ms : null;
  let pass = typeof s.pass === 'number' ? s.pass : null;
  let total = typeof s.total === 'number' ? s.total : null;
  let err = typeof s.error === 'number' ? s.error : null;
  let fail = typeof s.fail === 'number' ? s.fail : null;
  if (totalMs == null && Array.isArray(d.queries)) {
    totalMs = d.queries.reduce((a, q) => a + (q.duration_ms || 0), 0);
  }
  if (pass == null && Array.isArray(d.queries)) {
    pass = d.queries.filter((q) => q.status === 'pass').length;
    total = d.queries.length;
  }
  if (err == null && Array.isArray(d.queries)) err = d.queries.filter((q) => q.status === 'error').length;
  if (fail == null && Array.isArray(d.queries)) fail = d.queries.filter((q) => q.status === 'fail').length;
  if (totalMs == null) continue;

  const sk = scaleKey(d.scale_factor);
  (suites[suite] ||= {});
  (suites[suite][sk] ||= []);
  suites[suite][sk].push({
    date: ts.slice(0, 10),
    ts,
    totalSec: Math.round((totalMs / 1000) * 100) / 100,
    pass: pass ?? null,
    total: total ?? null,
    err: err ?? null,
    fail: fail ?? null,
  });
}

// Reduce each (suite, scale) series to a clean, representative trend:
//   1. Keep only CLEAN FULL-suite runs — the full query count (drops single-
//      query / partial smoke runs), no errored or failed queries (drops runs
//      with "issues with errors"), and non-zero duration.
//   2. One point per DAY = the BEST (fastest) clean run that day. This collapses
//      same-day repeats and machine variance (cold-cache / contended runs are
//      slower; the fastest run reflects the engine).
// We deliberately do NOT shape the line further (no spike removal): the daily
// best of clean full passing runs is an honest, defensible series — real
// regressions stay visible.
for (const suite of Object.keys(suites)) {
  for (const sk of Object.keys(suites[suite])) {
    const pts = suites[suite][sk];
    const totals = pts.map((p) => p.total).filter((t) => typeof t === 'number' && t > 0);
    const fullCount = totals.length ? Math.max(...totals) : 0;
    // A run only counts if it is the FULL suite AND every query passed. The
    // earlier `total >= 0.8 * fullCount` + no-err/no-fail test let two kinds of
    // fast outlier through: partial runs (e.g. 18/22) whose duration covers
    // fewer queries, and skip-heavy runs (full query count, 0 fail, but many
    // SKIPPED) whose skipped queries cost ~0ms. Both plot as artificially fast
    // downward spikes. Requiring pass === total === fullCount drops them.
    const clean = pts.filter((p) =>
      p.totalSec > 0 &&
      fullCount > 0 && p.total === fullCount &&
      p.pass != null && p.pass === p.total &&
      (p.err == null || p.err === 0) &&
      (p.fail == null || p.fail === 0));

    const byDay = new Map();
    for (const p of clean) {
      const cur = byDay.get(p.date);
      if (!cur || p.totalSec < cur.totalSec) byDay.set(p.date, p);
    }
    let daily = [...byDay.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date, totalSec: p.totalSec, pass: p.pass, total: p.total }));

    if (daily.length) suites[suite][sk] = daily;
    else delete suites[suite][sk];
  }
  if (Object.keys(suites[suite]).length === 0) delete suites[suite];
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), suites }, null, 0) + '\n');
const nSuites = Object.keys(suites).length;
console.log(`aggregate-benchmarks: ${files} runs -> ${nSuites} suites -> ${outFile}`);
