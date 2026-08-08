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

  // The bounds used to be hardcoded to 2016-2021. The series is now a fleet
  // age profile spanning every model year still registered (1990 to 2024), so
  // a fixed window silently hid most of it: the 1990 and 2023 figures called
  // out beside the chart both fell outside the range and could never be drawn.
  // Follow the data instead.
  const [yearMin, yearMax] = useMemo(() => {
    if (!raw.length) return [null, null];
    const years = raw.map((d) => d.year);
    return [Math.min(...years), Math.max(...years)];
  }, [raw]);

  const [selectedStartYear, setSelectedStartYear] = useState(null);
  const [selectedEndYear, setSelectedEndYear] = useState(null);

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

  // Open on the whole series, and re-widen if the data ever changes shape.
  useEffect(() => {
    if (yearMin === null) return;
    setSelectedStartYear(yearMin);
    setSelectedEndYear(yearMax);
  }, [yearMin, yearMax]);

  // Filter data within selected range

  useEffect(() => {
    if (selectedStartYear === null || selectedEndYear === null) {
      setData(raw || []);
      return;
    }
    const filtered = (raw || []).filter(
      (r) => r.year >= selectedStartYear && r.year <= selectedEndYear
    );
    setData(filtered);
  }, [raw, selectedStartYear, selectedEndYear]);

  return (
    // Header and content share one container. The grid used to sit outside
    // it and run full bleed, so the title was indented against a chart that
    // started at the window edge.
    <div className="max-w-5xl mx-auto px-5 pt-4 pb-7">
        {/* Header */}
        <div className="flex justify-between gap-3 items-baseline flex-wrap">
          <div>
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.01em] text-teal-600">
              Insights: Victoria's Car Fleet
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              BITRE Road Vehicles Australia, January 2025 · Victoria,
              passenger vehicles
            </p>
          </div>
        </div>

        {/* Layout: left (controls + chart) and right (insights) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* LEFT: slider + chart */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {/* Single slider, bounded by whatever years the data covers */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-md">
              <div className="mb-3 text-base font-semibold text-teal-600">
                {yearMin === null ? "Year" : `Year (${yearMin}–${yearMax})`}
              </div>
              <div className="flex flex-col gap-2">
                {/* Single-thumb range: control only the end year */}
                <div className="relative h-6">
                  <input
                    aria-label="End year"
                    type="range"
                    min={yearMin ?? 0}
                    max={yearMax ?? 0}
                    step={1}
                    value={selectedEndYear ?? yearMax ?? 0}
                    disabled={yearMin === null}
                    onChange={(e) => {
                      const next = clamp(
                        Number(e.target.value),
                        selectedStartYear ?? yearMin,
                        yearMax
                      );
                      setSelectedEndYear(next);
                    }}
                    className="accent-tealLight absolute inset-0 w-full bg-transparent disabled:opacity-40"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{yearMin ?? "—"}</span>
                  <span className="font-medium text-gray-700">
                    {yearMin === null
                      ? "Loading…"
                      : `Selected: ${selectedStartYear}–${selectedEndYear}`}
                  </span>
                  <span>{yearMax ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Chart panel: Line chart */}
            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-md">
              <div className="mb-2 text-base font-semibold text-teal-600">
                Registered passenger vehicles by year of manufacture
              </div>
              <div className="mb-3 text-xs text-gray-500">
                How many cars of each model year are still on Victorian roads.
                Counts are as at 31 January 2025.
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
                <li>Victoria's fleet is young: just over half of it, 51%, was built in 2015 or later.</li>
                <li>Only 10% of cars on the road predate 2005.</li>
                <li>2023 is the most common model year, with about 248,000 still registered.</li>
                <li>There are 27% fewer 2020 cars than 2019 ones, a visible dent left by pandemic factory shutdowns.</li>
                <li>Around 5,100 cars built in 1990 are still registered, 35 years on.</li>
              </ul>
            </div>
          </div>
        </div>
    </div>
  );
}