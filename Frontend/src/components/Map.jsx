import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/** Melbourne CBD approximate center */
const CBD = { lat: -37.8136, lng: 144.9631 };

/** Simple legend component */
function Legend() {
  const items = [
    { color: "#10b981", label: "Available" },
    { color: "#f59e0b", label: "Busy" },
    { color: "#ef4444", label: "Full" },
    { color: "#3b82f6", label: "Unknown" },
  ];
  return (
    <div style={{
      position: "absolute", right: 12, bottom: 12, background: "white",
      padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)", fontSize: 12
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Legend</div>
      {items.map(i => (
        <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{
            display: "inline-block", width: 12, height: 12, borderRadius: 999,
            background: i.color, border: "1px solid #d1d5db"
          }} />
          <span>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Fit map to points when they load */
function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const latlngs = points.map(p => [p.lat, p.lng]);
    if (latlngs.length === 1) {
      map.setView(latlngs[0], 16);
    } else {
      map.fitBounds(latlngs, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

/** Utility: generate N random points within a small bbox around CBD */
function generateMockPoints(n = 120) {
  // Rough bbox around CBD
  const minLat = -37.8260, maxLat = -37.8060;
  const minLng = 144.9520, maxLng = 144.9780;

  const statuses = ["available", "busy", "full", "unknown"];
  const names = ["Collins St", "Bourke St", "Flinders Ln", "Queen St", "Lonsdale St", "Swanston St", "Russell St"];

  const pts = [];
  for (let i = 0; i < n; i++) {
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    const statusRoll = Math.random();
    const status =
      statusRoll < 0.55 ? "available" :
      statusRoll < 0.85 ? "busy" :
      statusRoll < 0.97 ? "full" : "unknown";
    const name = `${names[Math.floor(Math.random() * names.length)]} Bay ${Math.floor(1 + Math.random() * 150)}`;

    pts.push({
      id: `mock-${i}`,
      name,
      lat,
      lng,
      status,
      capacity: 1,
    });
  }
  return pts;
}

const colorFor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "available": return "#10b981"; // green
    case "busy":      return "#f59e0b"; // amber
    case "full":      return "#ef4444"; // red
    default:          return "#3b82f6"; // blue
  }
};

export default function CbdMapMock() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate once per mount
  const mock = useMemo(() => generateMockPoints(120), []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => { setPoints(mock); setLoading(false); }, 150);
    return () => clearTimeout(t);
  }, [mock]);

  const containerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "12px 20px 24px",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Parking Map — Melbourne CBD</h1>
      <p style={{ marginTop: 6, color: "#6b7280" }}>
        Mock locations (lat/lng). Tiles © OpenStreetMap & Carto.
      </p>

      <div style={{ height: 560, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", position: "relative" }}>
        <MapContainer
          center={[CBD.lat, CBD.lng]}
          zoom={15}
          minZoom={12}
          maxZoom={19}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          {/* Minimal, clean basemap (Carto Light) */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          />

          <FitToPoints points={points} />

          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{
                color: colorFor(p.status),
                fillColor: colorFor(p.status),
                fillOpacity: 0.9,
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>
                    <div><b>Status:</b> {p.status}</div>
                    <div><b>Capacity:</b> {p.capacity}</div>
                    <div style={{ marginTop: 6, color: "#6b7280" }}>
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <Legend />
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
        {loading ? "Loading mock points…" : `Loaded ${points.length} mock points.`}
      </div>
    </div>
  );
}
