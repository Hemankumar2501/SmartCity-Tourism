"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { Compass, Trash2, ArrowRight, LayoutDashboard, Bookmark, Heart, Sparkles } from "lucide-react";
import ItineraryDisplay from "../components/ItineraryDisplay";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, savedItineraries, logout, deleteItinerary, login } = useAuth();
  const { themeClasses } = useTheme();
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);

  const selectedItinerary = savedItineraries.find((item) => item.id === selectedItineraryId);

  // Auto-select first itinerary if available
  useEffect(() => {
    if (savedItineraries.length > 0 && !selectedItineraryId) {
      setSelectedItineraryId(savedItineraries[0].id);
    }
  }, [savedItineraries, selectedItineraryId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col md:flex-row h-[calc(100vh-130px)] overflow-hidden relative z-10"
    >
      {/* Sidebar Panel */}
      <aside className="w-full md:w-80 bg-slate-950/45 border-b md:border-b-0 md:border-r border-white/10 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto p-6 space-y-6">
        
        {/* User Profile Card */}
        {user ? (
          <div className={`bg-white/5 border ${themeClasses.border} ${themeClasses.rounded} p-4 flex items-center gap-3`}>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-gray-200 block truncate">{user.name}</span>
              <span className="text-[10px] text-gray-400 block truncate">{user.email}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center space-y-3">
            <p className="text-xs text-gray-400">Sign in to sync your saved itineraries across devices.</p>
            <button
              onClick={login}
              className={`w-full py-2.5 text-xs font-bold cursor-pointer transition-colors ${themeClasses.btn}`}
            >
              Sign In with Google
            </button>
          </div>
        )}

        {/* Favorite Destinations (Mock) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-500" />
            <span>Favorite Spots</span>
          </h3>
          <div className="space-y-2">
            {[
              { city: "Tokyo", tag: "Tech & Tradition" },
              { city: "Paris", tag: "Romance & Art" },
              { city: "Dubai", tag: "Futuristic Wonder" }
            ].map((fav, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs hover:bg-white/10 transition-colors">
                <span className="font-bold text-gray-200">{fav.city}</span>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                  {fav.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Itineraries Selector List */}
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved Plans ({savedItineraries.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {savedItineraries.length === 0 ? (
              <div className="text-center py-8">
                <Compass className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                <p className="text-[10px] text-gray-500">No saved travel plans found.</p>
                <Link href="/explore" className="text-[10px] text-cyan-400 hover:underline mt-1 inline-block">
                  Build a new plan &rarr;
                </Link>
              </div>
            ) : (
              savedItineraries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItineraryId(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex justify-between items-start group ${
                    selectedItineraryId === item.id
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                      : "bg-white/5 border-white/5 hover:border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs font-bold block truncate">
                      {item.destinations.join(" & ")}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {item.duration_days} Days | ${item.total_estimated_cost.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItinerary(item.id);
                      if (selectedItineraryId === item.id) {
                        setSelectedItineraryId(null);
                      }
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Detail Display */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {selectedItinerary ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Viewing Saved Itinerary</span>
                </span>
                <h2 className="text-xl font-bold text-gray-100">
                  Trip to {selectedItinerary.destinations.join(", ")}
                </h2>
              </div>
            </div>
            <ItineraryDisplay plan={selectedItinerary} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-3">
              <LayoutDashboard className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="font-bold text-gray-400">No Plan Selected</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Select an itinerary from the sidebar or head over to the planner page to create your next route.
              </p>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}
