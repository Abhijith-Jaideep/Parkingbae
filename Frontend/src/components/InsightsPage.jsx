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
  const [raw, setRaw] = useState([]);
  const API_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

  const minYear = useMemo(
    () => (raw.length ? Math.min(...raw.map(d => d.year)) : 2016),
    [raw]
  );
  const maxYear = useMemo(
    () => (raw.length ? Math.max(...raw.map(d => d.year)) : 2020),
    [raw]
  );

  const [fromYear, setFromYear] = useState(minYear);
  const [toYear, setToYear] = useState(maxYear);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/car_ownership`, {
          headers: { Accept: "application/json" }
        });
        const text = await res.text();
        const json = JSON.parse(text);
        const rows = Array.isArray(json) ? json : (Array.isArray(json?.rows) ? json.rows : []);
        const normalized = (rows || []).map(r => ({
          year: Number(r.Year),
          vehicles: Number(r.Number_of_cars_vic),
          attrition: r.Attrition_rate != null ? Number(r.Attrition_rate) : undefined,
        })).filter(r => !Number.isNaN(r.year) && !Number.isNaN(r.vehicles));
        if (!cancelled) {
          setRaw(normalized)
        }
      } catch (e) {
        console.error("Network/parse error:", e?.message || e)
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [API_URL]);

  useEffect(() => {
    if (!raw.length) return;
    const min = Math.min(...raw.map(d => d.year));
    const max = Math.max(...raw.map(d => d.year));
    setFromYear(min);
    setToYear(max);
  }, [raw]);


  useEffect(() => {
    const filtered = raw.filter(r => r.year >= fromYear && r.year <= toYear);
    setData(filtered);
  }, [raw, fromYear, toYear]);

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


  const onFromYearChange = (val) => setFromYear(Math.max(minYear, Math.min(Number(val), toYear)));
  const onToYearChange = (val) => setToYear(Math.min(maxYear, Math.max(Number(val), fromYear)));

  return (
    <>
      <div className="max-w-5xl mx-auto px-5 pt-4 pb-7">
        <div className="flex justify-between gap-3 items-baseline flex-wrap">
          <div>
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.01em] text-teal-600">
              Insights — Car Ownership (Victoria)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ABS Motor Vehicle Census · Victoria (State-level only)
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm mt-4">
          <div className="mb-3 text-base font-semibold text-teal-600">Year Range</div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fromYear" className="text-xs text-gray-500">
                From
              </label>
              <input
                id="fromYear"
                type="range"
                min={minYear}
                max={maxYear}
                step={1}
                value={fromYear}
                onChange={(e) => onFromYearChange(e.target.value)}
                className="accent-tealLight"
              />
              <input
                className="px-2 py-2 border border-gray-200 rounded-md text-sm"
                type="number"
                min={minYear}
                max={toYear}
                value={fromYear}
                onChange={(e) => onFromYearChange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="toYear" className="text-xs text-gray-500">
                To
              </label>
              <input
                id="toYear"
                type="range"
                min={minYear}
                max={maxYear}
                step={1}
                value={toYear}
                onChange={(e) => onToYearChange(e.target.value)}
                className="accent-tealLight"
              />
              <input
                className="px-2 py-2 border border-gray-200 rounded-md text-sm"
                type="number"
                min={fromYear}
                max={maxYear}
                value={toYear}
                onChange={(e) => onToYearChange(e.target.value)}
              />
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-2">
            Showing {fromYear}–{toYear}
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-3">
          <KPI
            title="Latest Vehicles"
            value={formatInt(kpis.latest)}
            subtitle={`Year: ${data.length ? data[data.length - 1].year : "—"}`}
          />
          <KPI title="CAGR" value={`${(kpis.cagr * 100).toFixed(2)}%`} subtitle={`${fromYear}–${toYear}`} />
          <KPI
            title="Peak Year"
            value={kpis.peakYear || "—"}
            subtitle={kpis.peakVal ? formatInt(kpis.peakVal) : ""}
          />
          <KPI title="Years Covered" value={data.length} subtitle={`${fromYear}–${toYear}`} />
        </div>


        <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm mt-3">
          <div className="mb-2 text-base font-semibold text-teal-600">
            Victoria Historical Car Ownership
          </div>
          <div className="w-full h-[340px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                Loading chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => formatInt(val)} labelFormatter={(l) => `Year: ${l}`} />
                  <Bar dataKey="vehicles" radius={[6, 6, 0, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm mt-3">
          <div className="mb-3 text-base font-semibold text-teal-600">Insight on data</div>
          <ul className="m-0 pl-5 text-sm text-gray-500 leading-6 list-disc">
            <li>Victoria’s registered vehicles fell from 209,495 (2016) to 188,855 (2020)—a net drop of 20,640 (CAGR –2.56%).</li>
            <li>Biggest rise in 2018 (+22,021 / +10.27%); biggest fall in 2020 (–26,873 / –12.46%).</li>
            <li>Average annual change –5,160 vehicles</li>
            <li> average attrition rate 4.08% (high 4.50% in 2018, low 3.50% in 2020).</li>
        </ul>
      </div>
    </div >
    </>
  );
}


function KPI({ title, value, subtitle }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
      <div className="text-xs text-gray-500 mb-1.5">{title}</div>
      <div className="text-[22px] font-bold text-teal-600">{value}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}
    </div>
  );
}
