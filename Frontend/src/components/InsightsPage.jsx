import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Format integer values with commas for display
function formatInt(n) {
  return Number(n || 0).toLocaleString();
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export default function InsightsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState([]);

  const API_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

  // Fixed slider bounds per your request
  const SLIDER_MIN = 2016;
  const SLIDER_MAX = 2021;

  // Use the latest year available in RAW (clamped to slider bounds) as initial selection
  const initialYear = useMemo(() => {
    if (!raw.length) return SLIDER_MAX;
    const maxInRaw = Math.max(...raw.map((d) => d.year));
    return clamp(maxInRaw, SLIDER_MIN, SLIDER_MAX);
  }, [raw]);


  const [selectedStartYear, setSelectedStartYear] = useState(SLIDER_MIN);
  const [selectedEndYear, setSelectedEndYear] = useState(initialYear);

  // Fetch data once

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/car_ownership`, {
          headers: { Accept: "application/json" },
        });
        const text = await res.text();
        const json = JSON.parse(text);
        const rows = Array.isArray(json) ? json : Array.isArray(json?.rows) ? json.rows : [];
        const normalized = (rows || [])
          .map((r) => ({
            year: Number(r.Year),
            vehicles: Number(r.Number_of_cars_vic),
          }))
          .filter((r) => !Number.isNaN(r.year) && !Number.isNaN(r.vehicles));

        if (!cancelled) setRaw(normalized);
      } catch (e) {
        console.error("Network/parse error:", e?.message || e);
        if (!cancelled) setRaw([]);

      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  // Keep selectedEndYear in sync when raw changes and ensure start <= end
  useEffect(() => {
    setSelectedEndYear((prev) => clamp(prev || SLIDER_MAX, SLIDER_MIN, SLIDER_MAX));
    setSelectedStartYear((prev) => clamp(prev || SLIDER_MIN, SLIDER_MIN, SLIDER_MAX));
  }, [raw]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter data within selected range

  useEffect(() => {
    const filtered = (raw || []).filter(
      (r) => r.year >= selectedStartYear && r.year <= selectedEndYear
    );
    setData(filtered);
  }, [raw, selectedStartYear, selectedEndYear]);

  return (
    <>
      <div className="max-w-5xl mx-auto px-5 pt-4 pb-7">
        {/* Header */}
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
      </div>

       {/* Layout: left (controls + chart) and right (insights) */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* LEFT: slider + chart */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {/* Single slider (2016–2021) */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-md">
              <div className="mb-3 text-base font-semibold text-teal-600">
                Year (2016–2021)
              </div>
              <div className="flex flex-col gap-2">
                {/* Single-thumb range: control only the end year */}
                <div className="relative h-6">
                  <input
                    aria-label="End year"
                    type="range"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={1}
                    value={selectedEndYear}
                    onChange={(e) => {
                      const next = clamp(Number(e.target.value), selectedStartYear, SLIDER_MAX);
                      setSelectedEndYear(next);
                    }}
                    className="accent-tealLight absolute inset-0 w-full bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{SLIDER_MIN}</span>
                  <span className="font-medium text-gray-700">
                    Selected: {selectedStartYear}–{selectedEndYear}
                  </span>
                  <span>{SLIDER_MAX}</span>
                </div>
              </div>
            </div>

            {/* Chart panel: Line chart */}
            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-md">
              <div className="mb-2 text-base font-semibold text-teal-600">
                Victoria Historical Car Ownership
              </div>
              <div className="w-full h-[360px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Loading chart…
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(val) => formatInt(val)}
                        labelFormatter={(l) => `Year: ${l}`}
                      />
                      <Line
                        key={`line-${selectedStartYear}-${selectedEndYear}`}
                        type="monotone"
                        dataKey="vehicles"
                        stroke="#14b8a6"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: simplified insights for non-technical users */}
          <div className="lg:col-span-1 h-full">
            <div className="border border-teal-100 rounded-xl p-5 bg-gradient-to-b from-white to-teal-50/40 shadow-md h-full flex flex-col sticky lg:top-6">
              <div className="mb-3 text-base font-semibold text-teal-600">💡 Key insights</div>
              <ul className="list-disc pl-5 marker:text-teal-500 text-gray-700 text-[15px] leading-relaxed flex-1 flex flex-col justify-between space-y-6">
                <li>From 2016 to 2020, the total number of registered cars in Victoria generally went down.</li>
                <li>The strongest lift happened around 2018.</li>
                <li>The sharpest drop happened in 2020.</li>
                <li>Across these years, there was a small decrease on average each year.</li>
                <li>Each year, a small share of cars leave the register. This share was a bit higher around 2018 and lower in 2020.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}