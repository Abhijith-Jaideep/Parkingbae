import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ---------- Scoped styles (no extra libs) ---------- */
const styles = `
  .page {
    max-width: 1100px;     /* key change: prevents full-width stretching */
    margin: 0 auto;
    padding: 16px 20px 28px;
    box-sizing: border-box;
  }
  .muted { color: #6b7280; }
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px;
    background: #fff;
    box-shadow: 0 1px 0 rgba(0,0,0,0.03);
  }
  .card-lg { padding: 16px; }
  .section-title {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }
  .grid-kpi {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .grid-kpi { grid-template-columns: repeat(2, minmax(0,1fr)); }
  }
  @media (min-width: 960px) {
    .grid-kpi { grid-template-columns: repeat(4, minmax(0,1fr)); }
  }
  .filters {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 760px) {
    .filters { grid-template-columns: 1fr 1fr; }
  }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .input, .number {
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
  }
  .subtle {
    font-size: 13px;
    color: #6b7280;
    text-align: center;
    margin-top: 6px;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .chart-card { padding: 8px 12px 16px; }
`;

const MOCK_VIC_DATA = [
  { year: 2013, vehicles: 4632000 },
  { year: 2014, vehicles: 4728000 },
  { year: 2015, vehicles: 4851000 },
  { year: 2016, vehicles: 4997000 },
  { year: 2017, vehicles: 5164000 },
  { year: 2018, vehicles: 5338000 },
  { year: 2019, vehicles: 5524000 },
  { year: 2020, vehicles: 5631000 },
  { year: 2021, vehicles: 5759000 },
  { year: 2022, vehicles: 5946000 },
  { year: 2023, vehicles: 6123000 },
];

function formatInt(n) {
  return Number(n || 0).toLocaleString();
}
function calcCAGR(startVal, endVal, years) {
  if (startVal <= 0 || endVal <= 0 || years <= 0) return 0;
  return Math.pow(endVal / startVal, 1 / years) - 1;
}

export default function InsightsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const minYear = useMemo(
    () => (MOCK_VIC_DATA.length ? Math.min(...MOCK_VIC_DATA.map(d => d.year)) : 2013),
    []
  );
  const maxYear = useMemo(
    () => (MOCK_VIC_DATA.length ? Math.max(...MOCK_VIC_DATA.map(d => d.year)) : 2023),
    []
  );

  const [fromYear, setFromYear] = useState(minYear);
  const [toYear, setToYear] = useState(maxYear);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        // Replace with real API if needed:
        // const res = await fetch(`/api/ownership?vicOnly=true&from=${fromYear}&to=${toYear}`);
        // const json = await res.json();
        // if (!cancelled) setData(json.rows);

        const filtered = MOCK_VIC_DATA.filter(r => r.year >= fromYear && r.year <= toYear);
        setTimeout(() => { if (!cancelled) setData(filtered); }, 80);
      } catch (e) {
        console.error(e);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [fromYear, toYear]);

  const kpis = useMemo(() => {
    if (!data.length) return { latest: 0, cagr: 0, peakYear: 0, peakVal: 0 };
    const sorted = [...data].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const years = last.year - first.year || 1;
    const cagr = calcCAGR(first.vehicles, last.vehicles, years);
    const peak = sorted.reduce((acc, cur) => (cur.vehicles > acc.vehicles ? cur : acc), sorted[0]);
    return { latest: last.vehicles, cagr, peakYear: peak.year, peakVal: peak.vehicles };
  }, [data]);

  // keep ranges sane
  const onFromYearChange = (val) => setFromYear(Math.max(minYear, Math.min(Number(val), toYear)));
  const onToYearChange   = (val) => setToYear(Math.min(maxYear, Math.max(Number(val), fromYear)));

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        {/* Header */}
        <div className="header-row">
          <div>
            <h1 className="h1">Insights — Car Ownership (Victoria)</h1>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
              ABS Motor Vehicle Census · Victoria (State-level only)
            </p>
          </div>
          <small className="muted" style={{ fontSize: 13 }}>
            Defaults to all available years. Use the inputs to refine.
          </small>
        </div>

        {/* Filters */}
        <div className="card card-lg" style={{ marginTop: 16 }}>
          <div className="section-title">Year Range</div>
          <div className="filters">
            <div className="field">
              <label htmlFor="fromYear" className="muted" style={{ fontSize: 12 }}>From</label>
              <input
                id="fromYear" type="range"
                min={minYear} max={maxYear} step={1}
                value={fromYear}
                onChange={(e) => onFromYearChange(e.target.value)}
              />
              <input
                className="number" type="number"
                min={minYear} max={toYear}
                value={fromYear}
                onChange={(e) => onFromYearChange(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="toYear" className="muted" style={{ fontSize: 12 }}>To</label>
              <input
                id="toYear" type="range"
                min={minYear} max={maxYear} step={1}
                value={toYear}
                onChange={(e) => onToYearChange(e.target.value)}
              />
              <input
                className="number" type="number"
                min={fromYear} max={maxYear}
                value={toYear}
                onChange={(e) => onToYearChange(e.target.value)}
              />
            </div>
          </div>
          <div className="subtle">Showing {fromYear}–{toYear}</div>
        </div>

        {/* KPI Cards */}
        <div className="grid-kpi" style={{ marginTop: 14 }}>
          <KPI title="Latest Vehicles" value={formatInt(kpis.latest)} subtitle={`Year: ${data.length ? data[data.length - 1].year : "—"}`} />
          <KPI title="CAGR" value={`${(kpis.cagr * 100).toFixed(2)}%`} subtitle={`${fromYear}–${toYear}`} />
          <KPI title="Peak Year" value={kpis.peakYear || "—"} subtitle={kpis.peakVal ? formatInt(kpis.peakVal) : ""} />
          <KPI title="Years Covered" value={data.length} subtitle={`${fromYear}–${toYear}`} />
        </div>

        {/* Chart */}
        <div className="card chart-card" style={{ marginTop: 14 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Victoria Historical Car Ownership</div>
          <div style={{ width: "100%", height: 340 }}>
            {loading ? (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }} className="muted">
                Loading chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => formatInt(val)}
                    labelFormatter={(l) => `Year: ${l}`}
                  />
                  <Bar dataKey="vehicles" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card card-lg" style={{ marginTop: 14 }}>
          <div className="section-title">Data & Assumptions</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
            <li>Scope is <strong>Victoria-only</strong> for MVP.</li>
            <li>Default view loads <em>all available years</em>.</li>
            <li>Replace mock data with your API response: <code>[&#123; year, vehicles &#125;]</code>.</li>
            <li>Consider caching and showing a “last updated” note on outages.</li>
          </ul>
        </div>
      </div>
    </>
  );
}

/* ---------- Simple KPI card ---------- */
function KPI({ title, value, subtitle }) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {subtitle ? <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{subtitle}</div> : null}
    </div>
  );
}
