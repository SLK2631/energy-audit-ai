// /api/refresh-benchmarks.js
// Vercel serverless function — invoked daily by cron.
// Fetches EIA average retail prices (electricity + natural gas) for all
// states & sectors, then writes a compact JSON to a PUBLIC Vercel Blob.
//
// Env vars required (set in Vercel → Settings → Environment Variables):
//   EIA_API_KEY            — your EIA Open Data key
//   CRON_SECRET            — auto-set by Vercel when you add a cron; used to authorize
//   BLOB_READ_WRITE_TOKEN  — auto-set when you create the Blob store
//
// Notes:
//   - EIA electricity prices are in cents/kWh.
//   - EIA natural gas residential/commercial prices are in $/thousand cubic feet (MCF).
//     We convert to $/therm (1 MCF ≈ 10.37 therms) so it matches how bills read.
//   - Water has no national source; benchmarks for water stay null here.

import { put } from "@vercel/blob";

const EIA_BASE = "https://api.eia.gov/v2";

// Map our internal sector codes to EIA sector IDs
const ELEC_SECTORS = { RES: "RES", COM: "COM", IND: "IND" };
const GAS_SECTORS = { RES: "residential", COM: "commercial", IND: "industrial" };

// 1 thousand cubic feet of natural gas ≈ 10.37 therms (EIA standard conversion)
const THERMS_PER_MCF = 10.37;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EIA fetch failed ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// --- Electricity: latest monthly retail price by state & sector (cents/kWh) ---
async function fetchElectricity(apiKey) {
  // retail-sales returns price in cents/kWh
  const url =
    `${EIA_BASE}/electricity/retail-sales/data/` +
    `?api_key=${apiKey}` +
    `&frequency=monthly` +
    `&data[0]=price` +
    `&sort[0][column]=period&sort[0][direction]=desc` +
    `&length=5000`;
  const json = await fetchJson(url);
  const rows = json?.response?.data || [];

  // Keep only the most recent period per (state, sector)
  const out = {};
  let latestPeriod = null;
  for (const r of rows) {
    if (!latestPeriod) latestPeriod = r.period;
    // rows are sorted desc by period; once we drop below the latest period we can stop
    if (r.period !== latestPeriod) continue;
    const state = r.stateid;
    const sector = r.sectorid; // RES / COM / IND / ALL / TRA
    if (!state || !sector) continue;
    if (!["RES", "COM", "IND"].includes(sector)) continue;
    const price = parseFloat(r.price);
    if (Number.isNaN(price)) continue;
    out[state] = out[state] || {};
    out[state][sector] = price; // cents/kWh
  }
  return { period: latestPeriod, data: out };
}

// --- Natural gas: latest monthly price by state & sector ($/MCF → $/therm) ---
async function fetchGas(apiKey) {
  // natural-gas pri/sum gives prices; residential = N3010, commercial = N3020, industrial = N3035
  // We use the price/sum endpoint with process facets per sector.
  // Series: $/thousand cubic feet.
  const sectors = [
    { code: "RES", process: "PRS" }, // residential price
    { code: "COM", process: "PCS" }, // commercial price
    { code: "IND", process: "PIN" }, // industrial price
  ];

  const out = {};
  let latestPeriod = null;

  for (const s of sectors) {
    const url =
      `${EIA_BASE}/natural-gas/pri/sum/data/` +
      `?api_key=${apiKey}` +
      `&frequency=monthly` +
      `&data[0]=value` +
      `&facets[process][]=${s.process}` +
      `&sort[0][column]=period&sort[0][direction]=desc` +
      `&length=2000`;

    let json;
    try {
      json = await fetchJson(url);
    } catch (e) {
      // If one sector fails, continue with the others rather than failing the whole job
      console.error(`Gas fetch failed for ${s.code}:`, e.message);
      continue;
    }
    const rows = json?.response?.data || [];
    let periodForSector = null;
    for (const r of rows) {
      if (!periodForSector) periodForSector = r.period;
      if (r.period !== periodForSector) continue;
      const state = r.duoarea?.replace(/^S/, ""); // duoarea like "SNC" → "NC"
      if (!state || state.length !== 2) continue;
      const dollarsPerMcf = parseFloat(r.value);
      if (Number.isNaN(dollarsPerMcf)) continue;
      const dollarsPerTherm = dollarsPerMcf / THERMS_PER_MCF;
      out[state] = out[state] || {};
      out[state][s.code] = Math.round(dollarsPerTherm * 1000) / 1000; // $/therm, 3dp
    }
    if (periodForSector && (!latestPeriod || periodForSector > latestPeriod)) {
      latestPeriod = periodForSector;
    }
  }
  return { period: latestPeriod, data: out };
}

export default async function handler(req, res) {
  // --- Authorize: only allow Vercel Cron (or manual call with the secret) ---
  const auth = req.headers["authorization"];
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "EIA_API_KEY not configured" });
  }

  try {
    const [elec, gas] = await Promise.all([
      fetchElectricity(apiKey),
      fetchGas(apiKey),
    ]);

    const payload = {
      generatedAt: new Date().toISOString(),
      source: "U.S. Energy Information Administration (EIA)",
      electricity: {
        unit: "cents/kWh",
        period: elec.period,
        byState: elec.data,
      },
      gas: {
        unit: "$/therm",
        period: gas.period,
        byState: gas.data,
      },
      water: {
        unit: "$/gallon",
        period: null,
        byState: {}, // no national source; populated manually per-utility if ever needed
      },
    };

    // Write to PUBLIC blob at a stable pathname so the URL never changes.
    const blob = await put("benchmarks/latest.json", JSON.stringify(payload), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false, // stable URL
      cacheControlMaxAge: 60 * 60 * 6, // 6h CDN cache; data only changes monthly
      allowOverwrite: true,
    });

    return res.status(200).json({
      ok: true,
      url: blob.url,
      electricityPeriod: elec.period,
      gasPeriod: gas.period,
      electricityStates: Object.keys(elec.data).length,
      gasStates: Object.keys(gas.data).length,
    });
  } catch (err) {
    console.error("refresh-benchmarks failed:", err);
    return res.status(500).json({ error: err.message });
  }
}
