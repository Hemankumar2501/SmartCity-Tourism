"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Import Leaflet CSS stylesheet
import "leaflet/dist/leaflet.css";

// Fix default marker icon issues in Next.js / Webpack
if (typeof window !== "undefined") {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

interface MapPin {
  dayNumber: number;
  timeOfDay: string;
  location: string;
  description: string;
  coordinates: [number, number];
}

interface MapComponentProps {
  pins: MapPin[];
  center: [number, number];
}

export default function MapComponent({ pins, center }: MapComponentProps) {
  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin, idx) => (
          <Marker key={idx} position={pin.coordinates}>
            <Popup className="custom-leaflet-popup">
              <div className="text-gray-900 font-sans p-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                    Day {pin.dayNumber}
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    {pin.timeOfDay}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-800">{pin.location}</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{pin.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
