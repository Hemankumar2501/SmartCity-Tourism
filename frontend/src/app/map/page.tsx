"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../components/ThemeContext";
import { MapPin, Search, Compass, Layers, Navigation, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("../components/MapComponent"), { ssr: false });

interface Pin {
  dayNumber: number;
  timeOfDay: string;
  location: string;
  description: string;
  coordinates: [number, number];
}

export default function MapPage() {
  const { themeClasses } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Paris");
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); // Paris default
  const [loading, setLoading] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"landmarks" | "transit" | "eco">("landmarks");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
        }
      }
    } catch (err) {
      console.error("Map geocoding failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mock landmarks/activities based on resolved mapCenter coordinates
  const mapPins = useMemo<Pin[]>(() => {
    const landmarks = [
      { name: "Urban Tech Gateway", desc: "Central autonomous shuttle station featuring AR guides." },
      { name: "Virtual History Museum", desc: "Interactive holograms detailing local culture." },
      { name: "Eco-Dome Smart Park", desc: "Botanical garden maintaining real-time carbon indices." },
      { name: "IoT Marketplace", desc: "Decentralized food terminals and digital payment vendors." }
    ];

    return landmarks.map((landmark, idx) => {
      const offsetLat = (idx === 0 ? 0.005 : idx === 1 ? -0.004 : idx === 2 ? 0.006 : -0.005);
      const offsetLng = (idx === 0 ? -0.005 : idx === 1 ? 0.006 : idx === 2 ? 0.004 : -0.004);
      return {
        dayNumber: 1,
        timeOfDay: idx === 0 ? "Morning" : idx === 1 ? "Midday" : idx === 2 ? "Afternoon" : "Evening",
        location: landmark.name,
        description: landmark.desc,
        coordinates: [mapCenter[0] + offsetLat, mapCenter[1] + offsetLng]
      };
    });
  }, [mapCenter]);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-130px)] overflow-hidden relative">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-96 bg-slate-950/45 border-b md:border-b-0 md:border-r border-white/10 backdrop-blur-xl p-6 flex flex-col z-10 shrink-0 overflow-y-auto space-y-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Compass className={`w-5 h-5 ${themeClasses.text}`} />
            <span>Interactive Map Explorer</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Search cities globally, toggle transit overlays, and plot simulated routes.
          </p>
        </div>

        {/* Search location */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search destination city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Layer View Selector */}
        <div className="space-y-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Layer Overlay View
          </span>
          <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
            {(["landmarks", "transit", "eco"] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeLayer === layer
                    ? "bg-white/10 text-cyan-300 shadow-inner"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Route Directions Display */}
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Simulated Travel Route
          </span>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {mapPins.map((pin, idx) => (
              <div
                key={idx}
                className={`bg-white/5 border border-white/5 ${themeClasses.rounded} p-4 hover:bg-white/10 transition-colors relative flex gap-3`}
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {idx < mapPins.length - 1 && (
                    <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-500/40 to-transparent my-1" />
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase text-cyan-400 block tracking-wider">
                    Stop {idx + 1} &bull; {pin.timeOfDay}
                  </span>
                  <h4 className="font-bold text-gray-200 text-xs mt-0.5 truncate">{pin.location}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-1">{pin.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Map Viewport */}
      <main className="flex-1 h-full z-0 relative">
        {mounted && <MapComponent pins={mapPins} center={mapCenter} />}
      </main>
    </div>
  );
}
