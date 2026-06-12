// src/benchmarks.js
// Reads the EIA benchmark JSON written to public Blob by the daily cron,
// and provides simple lookups. Falls back gracefully if unavailable.
//
// IMPORTANT: set VITE_BENCHMARKS_URL in your Vercel env vars to the public
// blob URL (printed by /api/refresh-benchmarks on first run, and stable after).
// Example: https://<store-id>.public.blob.vercel-storage.com/benchmarks/latest.json

let _cache = null;
let _fetchedAt = 0;
const TTL_MS = 1000 * 60 * 60; // re-fetch at most hourly in the browser

const BENCHMARKS_URL = import.meta.env.VITE_BENCHMARKS_URL || "";

export async function loadBenchmarks() {
  // Return in-memory cache if fresh
  if (_cache && Date.now() - _fetchedAt < TTL_MS) return _cache;
  if (!BENCHMARKS_URL) return null;
  try {
    const res = await fetch(BENCHMARKS_URL, { cache: "no-store" });
    if (!res.ok) return _cache; // keep stale cache if fetch fails
    const json = await res.json();
    _cache = json;
    _fetchedAt = Date.now();
    return json;
  } catch {
    return _cache; // network error → keep whatever we had
  }
}

// Format a human-readable period like "2026-02" → "February 2026"
export function formatPeriod(period) {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return period || "";
  const [y, m] = period.split("-");
  const months = ["January","February","March","April","May","June","July",
    "August","September","October","November","December"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

// Look up a benchmark. fuel: "ELECTRIC" | "GAS" | "WATER". sector: "RES"|"COM"|"IND".
// Returns { value, unit, period, source, citation } or null.
export function getBenchmark(benchmarks, { fuel, state, sector }) {
  if (!benchmarks || !state || !sector) return null;
  const st = state.toUpperCase();
  const sec = sector.toUpperCase();

  let block, unit, period;
  if (fuel === "ELECTRIC") { block = benchmarks.electricity; }
  else if (fuel === "GAS") { block = benchmarks.gas; }
  else if (fuel === "WATER") { block = benchmarks.water; }
  else return null;

  if (!block) return null;
  unit = block.unit;
  period = block.period;
  const value = block.byState?.[st]?.[sec];
  if (value == null) return null;

  return {
    value,
    unit,
    period,
    source: benchmarks.source,
    citation: `${benchmarks.source}, ${formatPeriod(period)}`,
  };
}

// Given a bill's actual unit rate and a benchmark, compute the % difference.
// Returns { pct, direction, text } e.g. { pct: 16, direction: "above", text: "+16% above average" }
export function compareToBenchmark(actualRate, benchmark) {
  if (!benchmark || !actualRate || benchmark.value <= 0) return null;
  const diff = ((actualRate - benchmark.value) / benchmark.value) * 100;
  const rounded = Math.round(diff);
  if (rounded === 0) return { pct: 0, direction: "at", text: "At regional average" };
  const direction = rounded > 0 ? "above" : "below";
  const sign = rounded > 0 ? "+" : "";
  return {
    pct: Math.abs(rounded),
    direction,
    text: `${sign}${rounded}% ${direction} average`,
  };
}
