import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../index.css";


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper function for parsing day restrictions from parkign signs 
function expandDays(rangeStr) {
  if (!rangeStr) return [];
  // supports: "Mon-Fri", "Mon-Sat", "Sat", "Mon,Wed,Fri" (comma or slash separated)
  const clean = rangeStr.replace(/\s+/g, "");
  const parts = clean.split(/[,/]/);
  const out = new Set();

  for (const p of parts) {
    if (p.includes("-")) {
      const [a, b] = p.split("-");
      const i = DAYS.indexOf(a);
      const j = DAYS.indexOf(b);
      if (i !== -1 && j !== -1) {
        if (i <= j) {
          for (let k = i; k <= j; k++) out.add(DAYS[k]);
        } else {
          // wrap-around just in case (e.g., Sat-Mon)
          for (let k = i; k < DAYS.length; k++) out.add(DAYS[k]);
          for (let k = 0; k <= j; k++) out.add(DAYS[k]);
        }
      }
    } else if (DAYS.includes(p)) {
      out.add(p);
    }
  }
  return Array.from(out);
}

// Helper function to convert hours to minutes for filtering
function toMinutes(t) {
  if (!t) return null;
  // accepts "HH:MM" or "HH:MM:SS"
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Helper function to parse status of parking zones
function statusToBucket(s) {
  if (!s) return "Unknown";
  const sLow = s.toLowerCase();
  if (sLow.includes("unoccupied")) return "Available";
  if (sLow.includes("present")) return "Occupied";
  return "Unknown";
}

// Help function to parse last_updated timestamp for better readability 
function formatAgo(date) {
  if (!date) return "";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}


function ParkingMap() {
  //const [searchInput, setSearchInput] = useState(""); // Search Bar Functionality 
  const [dayFilter, setDayFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("");
  const [loading, setLoading] = useState(true); // State to check data is being fetched 
  const [err, setErr] = useState(null);
  const [spots, setSpots] = useState([]); // Array of parking data from backend 

  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Memoize static data so it doesn't change every render

  const statusColors = useMemo(() => ({
    Available: 'green',
    Occupied: 'red',
  }), []);

  // Fetch + normalize from your JSON shape
  useEffect(() => {
    const API_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/sensors_merged`, { cache: "no-store" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json(); // { merge_key, results: [...] }
        const norm = (data.results || []).map((item) => {
          const sensor = item.sensor || {};
          const loc = sensor.location || {};
          const statusBucket = statusToBucket(sensor.status_description);
          const updatedAt = sensor.lastupdated || null;

          // Normalize sign rows for filtering + popup
          const rules = (item.parking_sign_rows || []).map((r) => {
            const days = expandDays(r.Restriction_Days);
            return {
              days,
              display: r.Restriction_Display || "",
              start: r.Time_Restrictions_Start || "",
              finish: r.Time_Restrictions_Finish || "",
              startMin: toMinutes((r.Time_Restrictions_Start || "").slice(0, 5)),
              finishMin: toMinutes((r.Time_Restrictions_Finish || "").slice(0, 5)),
            };
          });

          return {
            // Shown name; tweak if you prefer RoadSegmentDescription from DB
            name: `Zone ${sensor.zone_number ?? "?"}`,
            coords: [loc.lat, loc.lon],
            status: statusBucket,
            rules, // array of restriction rows
            // For search convenience:
            updatedAt,
            zone_number: sensor.zone_number,
          };
        })
          // Drop any without coords
          .filter((s) => Number.isFinite(s.coords[0]) && Number.isFinite(s.coords[1]));

        if (!cancelled) setSpots(norm);
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);


  // Init map once
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map").setView([-37.8136, 144.9631], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // dedicated layer for markers
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // cleanup only on unmount
    return () => {
      map.remove();
      markersLayerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  // Recompute filtered spots when filters change
  // const q = searchInput.toLowerCase().trim();
  const timeMin = timeFilter ? toMinutes(timeFilter) : null;

  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      // const matchesSearch =
      //   !q ||
      //   s.name.toLowerCase().includes(q) ||
      //   String(s.zone_number || "").includes(q)

      // must have a zone number
      if (!s.zone_number) return false;

      // A spot matches day/time if ANY of its rules match the selected filters
      const ruleMatches = (rule) => {
        const dayOk = dayFilter === "all" || rule.days.includes(dayFilter);
        const timeOk =
          timeMin == null ||
          (rule.startMin != null &&
            rule.finishMin != null &&
            timeMin >= rule.startMin &&
            timeMin <= rule.finishMin);
        return dayOk && timeOk;
      };

      const matchesRestrictions =
        (s.rules && s.rules.length > 0)
          ? s.rules.some(ruleMatches)
          : true; // if no rules, don’t block it

      return matchesRestrictions;
    });
  }, [spots, dayFilter, timeMin]);

  // Update markers when filteredSpots/statusColors change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredSpots.forEach((spot) => {
      const marker = L.circleMarker(spot.coords, {
        radius: 8,
        fillColor: statusColors[spot.status] || "gray",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(layer);

      // Build popup with all sign rows
      const rulesHtml =
        spot.rules && spot.rules.length
          ? spot.rules
            .map(
              (r) =>
                `<div><b>${r.display || "-"}</b> · ${r.days.join(", ") || "-"} · ${r.start?.slice(0, 5) || "--:--"}–${r.finish?.slice(0, 5) || "--:--"}</div>`
            )
            .join("")
          : "<div>No posted restrictions</div>";
      const dt = spot.updatedAt ? new Date(spot.updatedAt) : null;
      const updatedLocal = dt ? dt.toLocaleString() : "--";
      const updatedAgo = dt ? ` (${formatAgo(dt)})` : "";

      marker.bindPopup(
        `<b>${spot.name}</b><br/>
        Status: ${spot.status}<br/><br/>
        ${rulesHtml}
        <hr style="margin:6px 0;"/>
        <small style="color:#6b7280">Updated: ${updatedLocal}${updatedAgo}</small>`
      );
    });
  }, [filteredSpots, statusColors]);

  return (
    <div className="w-full h-[800px] flex justify-center items-center p-4 ">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl p-6 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Melbourne CBD Live Map</h1>
              <p className="text-sm text-gray-500">
                {loading ? "Loading sensors…" : err ? `Error: ${err}` : `${filteredSpots.length} results`}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full">
            {/* <input
              type="text"
              placeholder="Search a street, zone, or landmark..."
              className="filter-input pl-10 pr-4 w-full md:min-w-[300px]"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} /> */}
            {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg> */}
          </div>
          <div className="flex w-full md:w-auto space-x-2 md:space-x-4">
            <select
              className="filter-input cursor-pointer min-w-[120px] md:w-1/2"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
            >
              <option value="all">All Days</option>
              <option value="Mon">Monday</option>
              <option value="Tue">Tuesday</option>
              <option value="Wed">Wednesday</option>
              <option value="Thu">Thursday</option>
              <option value="Fri">Friday</option>
              <option value="Sat">Saturday</option>
              <option value="Sun">Sunday</option>
            </select>
            <input
              type="time"
              className="filter-input cursor-pointer min-w-[120px] md:w-1/2"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)} />
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-grow min-h-[300px] max-h-[500px]">
          <div id="map" className="rounded-3xl shadow-2xl w-full h-full max-w-[1000px] max-h-[800px]"></div>

          {/* Legend */}
          <div className="absolute top-4 right-4 p-3 bg-white rounded-xl shadow-md text-sm text-gray-800 z-[1000]">
            <div className="flex items-center space-x-2">
              <div className="flex items-center"><span className="h-4 w-4 rounded-full bg-green-500 mr-2"></span>Available</div>
              <div className="flex items-center"><span className="h-4 w-4 rounded-full bg-red-500 mr-2"></span>Occupied</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000]">
          <details className="bg-white border border-gray-200 rounded-lg shadow-md p-3 w-64">
            <summary className="cursor-pointer font-medium text-gray-800">
              Parking Codes Legend
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 max-h-48 overflow-y-auto">
              <li>2P – Parking allowed for up to 2 hours</li>
              <li>1P – Parking allowed for up to 1 hour</li>
              <li>MP2P – Metered Parking, 2-hour limit</li>
              <li>4P – Parking allowed for up to 4 hours</li>
              <li>PP – Permissive Parking</li>
              <li>SP – Short-term Parking (~30 min)</li>
              <li>MP4P – Metered Parking, 4-hour limit</li>
              <li>LZ30 – Loading Zone, 30-minute limit</li>
              <li>MP1P – Metered Parking, 1-hour limit</li>
              <li>QP – Quarter-hour Parking (15 min)</li>
              <li>MP3P – Metered Parking, 3-hour limit</li>
              <li>HP – Holiday Parking</li>
              <li>FP1P – Free Parking, 1-hour limit</li>
              <li>LZ15 – Loading Zone, 15-minute limit</li>
              <li>FP15 – Free Parking, 15-minute limit</li>
              <li>3P – Parking allowed for up to 3 hours</li>
              <li>FP2P – Free Parking, 2-hour limit</li>
              <li>5P – Parking allowed for up to 5 hours</li>
              <li>DP2P – Disabled Permit Parking, 2-hour limit</li>
            </ul>
          </details>
        </div>

      </div>
    </div>
  );
}

export default ParkingMap;