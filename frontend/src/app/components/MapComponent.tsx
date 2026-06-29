"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Loader2 } from "lucide-react";
import { useTheme } from "./ThemeContext";

// Search action flyTo controller component
function MapSearchController({ searchCoords }: { searchCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (searchCoords) {
      map.flyTo(searchCoords, 14, { animate: true, duration: 1.5 });
    }
  }, [searchCoords, map]);
  return null;
}

// Auto-center map focus controller
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
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
  const { theme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Map theme name to class colors
  const themeColorClass = {
    solo: "cyan",
    couple: "purple",
    team: "amber"
  }[theme as "solo" | "couple" | "team"] || "cyan";

  const themeHex = {
    solo: "#06b6d4",
    couple: "#c084fc",
    team: "#f59e0b"
  }[theme as "solo" | "couple" | "team"] || "#06b6d4";

  // Create high-fidelity custom pulsing HTML/CSS leaflet pins
  const createThemedMarkerIcon = (dayNum: number) => {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Ping waves -->
          <div class="absolute w-8 h-8 rounded-full opacity-35 animate-ping" style="background-color: ${themeHex};"></div>
          
          <!-- Outer Ring -->
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-[9px] text-white" style="background-color: ${themeHex};">
            ${dayNum}
          </div>
        </div>
      `,
      className: "custom-leaflet-marker",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const createSearchMarkerIcon = () => {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 bg-emerald-500 rounded-full opacity-30 animate-ping"></div>
          <div class="w-8 h-8 bg-emerald-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
            ★
          </div>
        </div>
      `,
      className: "custom-leaflet-search-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );

      if (!res.ok) throw new Error("Search service failed.");

      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSearchCoords([lat, lon]);
        setSearchLabel(searchQuery);
      } else {
        setSearchError("Location not found.");
      }
    } catch (err: any) {
      setSearchError("Query failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Absolute Search bar container */}
      <form
        onSubmit={handleSearchSubmit}
        className="absolute top-4 left-4 right-4 sm:left-12 sm:right-auto z-[1000] flex items-center gap-2 p-1.5 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md rounded-xl border border-white/10 shadow-xl max-w-sm"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location (e.g. Dubai Marina)..."
          className="bg-transparent border-none text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-0 px-2.5 py-1.5 w-48 sm:w-64"
        />
        <button
          type="submit"
          disabled={searching}
          className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-lg text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {searching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </button>
      </form>

      {/* Mini Error Toast inside Map */}
      {searchError && (
        <div className="absolute top-16 left-12 z-[1000] px-3 py-1.5 bg-rose-950/90 border border-rose-500/20 text-rose-300 text-[10px] rounded-lg shadow-lg font-semibold">
          {searchError}
        </div>
      )}

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <ChangeView center={center} />
        <MapSearchController searchCoords={searchCoords} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Regular Itinerary Marker Pins */}
        {pins.map((pin, idx) => (
          <Marker
            key={idx}
            position={pin.coordinates}
            icon={createThemedMarkerIcon(pin.dayNumber)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="text-gray-900 font-sans p-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="px-1.5 py-0.5 text-white text-[10px] font-bold rounded"
                    style={{ backgroundColor: themeHex }}
                  >
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

        {/* Dynamic Search Marker Pin */}
        {searchCoords && (
          <Marker position={searchCoords} icon={createSearchMarkerIcon()}>
            <Popup>
              <div className="text-gray-900 font-sans p-1">
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  Search Result
                </span>
                <h4 className="font-bold text-sm text-gray-800 mt-1.5">{searchLabel}</h4>
                <p className="text-xs text-gray-500">Geocoded via OpenStreetMap Nominatim API</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
