"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { 
  Compass, Trash2, ArrowRight, LayoutDashboard, Bookmark, Heart, 
  Sparkles, Calendar, DollarSign, Globe, Share2, ArrowLeft, Clock
} from "lucide-react";
import ItineraryDisplay from "../components/ItineraryDisplay";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { user, savedItineraries, deleteItinerary, login } = useAuth();
  const { themeClasses } = useTheme();
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedItinerary = savedItineraries.find((item) => item.id === selectedItineraryId);

  // Stats calculation
  const totalTrips = savedItineraries.length;
  const totalBudget = savedItineraries.reduce((sum, item) => sum + item.total_estimated_cost, 0);
  const totalDays = savedItineraries.reduce((sum, item) => sum + item.duration_days, 0);
  const uniqueCities = new Set(
    savedItineraries.flatMap((item) => item.destinations.map((d) => d.toLowerCase().trim()))
  ).size;

  const handleShare = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/trip/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  // Helper to determine card border/gradients based on model or destinations
  const getCardStyle = (index: number) => {
    const styles = [
      {
        bg: "bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40",
        pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        grad: "from-cyan-500 to-blue-500"
      },
      {
        bg: "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-300 hover:border-purple-500/40",
        pill: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        grad: "from-purple-500 to-pink-500"
      },
      {
        bg: "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/40",
        pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        grad: "from-amber-500 to-orange-500"
      }
    ];
    return styles[index % styles.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col md:flex-row h-[calc(100vh-130px)] overflow-hidden relative z-10 bg-slate-50 dark:bg-transparent text-slate-800 dark:text-gray-100 transition-colors duration-300"
    >
      {/* Sidebar Panel */}
      <aside className="w-full md:w-80 bg-white/80 dark:bg-slate-950/45 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto p-6 space-y-6">
        {/* User Profile Card */}
        {user ? (
          <div className={`bg-slate-50 dark:bg-white/5 border ${themeClasses.border} ${themeClasses.rounded} p-4 flex items-center gap-3`}>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 dark:text-gray-200 block truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-gray-400 block truncate">{user.email}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-4 text-center space-y-3">
            <p className="text-xs text-slate-500 dark:text-gray-400">Sign in to sync your saved itineraries across devices.</p>
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
          <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-500" />
            <span>Favorite Spots</span>
          </h3>
          <div className="space-y-2">
            {[
              { city: "Tokyo", tag: "Tech & Tradition" },
              { city: "Paris", tag: "Romance & Art" },
              { city: "Dubai", tag: "Futuristic Wonder" }
            ].map((fav, idx) => (
              <div key={idx} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-xl flex items-center justify-between text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                <span className="font-bold text-slate-700 dark:text-gray-200">{fav.city}</span>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded font-semibold">
                  {fav.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation / Creation Vibe */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/5">
          <Link
            href="/explore"
            className="flex items-center justify-between w-full p-3.5 bg-gradient-to-r from-cyan-600/10 to-indigo-600/10 hover:from-cyan-600/20 hover:to-indigo-600/20 border border-cyan-500/20 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <span>Plan a New Journey</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <AnimatePresence mode="wait">
          {selectedItinerary ? (
            /* DETAILED VIEW MODE */
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Back Button / Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <button
                  onClick={() => setSelectedItineraryId(null)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Grid</span>
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 flex items-center gap-1 justify-end">
                    <Sparkles className="w-3 h-3" />
                    <span>Viewing Saved Plan</span>
                  </span>
                  <span className="text-xs text-slate-400 dark:text-gray-400">
                    Saved on {new Date(selectedItinerary.savedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Itinerary Timeline */}
              <ItineraryDisplay plan={selectedItinerary} />
            </motion.div>
          ) : (
            /* GRID OVERVIEW MODE */
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Heading */}
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-gray-100 flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-indigo-500" />
                  <span>Your Travel Command Hub</span>
                </h2>
                <p className="text-xs text-slate-400 dark:text-gray-400">
                  Track statistics, manage saved itineraries, and share journeys with your travel companions.
                </p>
              </div>

              {/* Statistics Panel */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block">Total Trips</span>
                    <span className="text-xl font-extrabold text-slate-700 dark:text-gray-200">{totalTrips}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block">Cities Visited</span>
                    <span className="text-xl font-extrabold text-slate-700 dark:text-gray-200">{uniqueCities}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block">Total Days</span>
                    <span className="text-xl font-extrabold text-slate-700 dark:text-gray-200">{totalDays}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block">Total Budget</span>
                    <span className="text-xl font-extrabold text-slate-700 dark:text-gray-200">${totalBudget.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Grid of Saved Itineraries */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-500" />
                  <span>Saved Itineraries ({savedItineraries.length})</span>
                </h3>

                {savedItineraries.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
                    <Compass className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4 animate-spin" style={{ animationDuration: "12s" }} />
                    <h4 className="font-bold text-slate-700 dark:text-gray-300 mb-2">No Saved Trips Found</h4>
                    <p className="text-xs text-slate-400 dark:text-gray-500 max-w-xs mx-auto mb-6">
                      Explore destinations, generate a customized itinerary, and save it to review here.
                    </p>
                    <Link
                      href="/explore"
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 ${themeClasses.btn}`}
                    >
                      <span>Create Trip Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedItineraries.map((trip, idx) => {
                      const cardStyle = getCardStyle(idx);
                      return (
                        <motion.div
                          key={trip.id}
                          whileHover={{ y: -4, scale: 1.01 }}
                          onClick={() => setSelectedItineraryId(trip.id)}
                          className={`bg-white dark:bg-slate-900/40 backdrop-blur-md border ${cardStyle.bg} rounded-2xl p-6 flex flex-col justify-between h-64 group relative overflow-hidden shadow-sm cursor-pointer transition-all duration-300`}
                        >
                          {/* Top row */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <span className={`text-[9px] px-2 py-0.5 border ${cardStyle.pill} rounded font-semibold uppercase tracking-wider`}>
                                {trip.model_version.split("-")[0] || "AI Planner"}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-gray-500">
                                {new Date(trip.savedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h4 className="text-lg font-bold tracking-tight text-slate-700 dark:text-gray-100 line-clamp-2">
                              {trip.destinations.join(" & ")}
                            </h4>
                          </div>

                          {/* Middle Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{trip.duration_days} Days</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 justify-end">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-extrabold text-slate-700 dark:text-gray-200">
                                ${trip.total_estimated_cost.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row / Actions */}
                          <div className="flex items-center justify-between pt-4 mt-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
                              <span>Open Plan</span>
                              <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                            </span>

                            <div className="flex gap-2">
                              {/* Share */}
                              <button
                                onClick={(e) => handleShare(e, trip.id)}
                                title="Share Trip Link"
                                className="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm("Are you sure you want to delete this itinerary?")) {
                                    await deleteItinerary(trip.id);
                                  }
                                }}
                                title="Delete Trip"
                                className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Share Copied Notification Overlay */}
                          <AnimatePresence>
                            {copiedId === trip.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="absolute inset-0 bg-[#070A13]/95 flex flex-col items-center justify-center text-center p-4 z-20"
                              >
                                <Sparkles className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
                                <span className="text-xs font-bold text-white">Share Link Copied!</span>
                                <span className="text-[10px] text-gray-400 mt-1">Paste it anywhere to share the journey.</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
