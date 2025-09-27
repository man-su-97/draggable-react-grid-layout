"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

type MarkerData = { name: string; coordinates: [number, number]; color?: string };
type MapWidgetProps = { title?: string; data?: MarkerData[] };

const demoMarkers: MarkerData[] = [
  { name: "New York", coordinates: [40.7128, -74.006] },
  { name: "London", coordinates: [51.5072, -0.1276] },
  { name: "Tokyo", coordinates: [35.6895, 139.6917] },
  { name: "Sydney", coordinates: [-33.8688, 151.2093] },
];

export default function MapWidget({ title, data }: MapWidgetProps) {
  const markers = data && data.length > 0 ? data : demoMarkers;

  const createIcon = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    return (color: string) =>
      new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md">
      {title && (
        <h3 className="text-lg font-semibold mb-2 px-2 text-card-foreground">
          {title}
        </h3>
      )}

      <div className="flex-1 relative rounded-md overflow-hidden shadow">
        <Suspense
          fallback={<div className="flex items-center justify-center h-full text-muted-foreground">🗺️ Loading map...</div>}
        >
          <MapContainer center={[20, 0]} zoom={2} className="absolute inset-0 w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {createIcon &&
              markers.map((m) => (
                <Marker key={m.name} position={m.coordinates} icon={createIcon(m.color || "blue")}>
                  <Popup>
                    <strong>{m.name}</strong>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </Suspense>
      </div>
    </div>
  );
}
