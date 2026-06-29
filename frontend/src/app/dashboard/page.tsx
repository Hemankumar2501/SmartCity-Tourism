"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Trash2,
  Calendar,
  DollarSign,
  ArrowLeft,
  Bot,
  User,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import ItineraryDisplay from "../components/ItineraryDisplay";

export default function Dashboard() {
  const { user, savedItineraries, logout, deleteItinerary, setShowLoginModal } = useAuth();
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);

  const selectedItinerary = savedItineraries.find((item) => item.id === selectedItineraryId);

  return (
    <div className="flex h-screen bg-[#070A13] text-gray-100 font-sans overflow-hidden">
      {/* Background decoration grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white/5 border-r border-white/10 backdrop-blur-xl flex flex-col z-10 shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Smart Tourism
            </h1>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">
              User Dashboard
            </span>
          </div>
        </div>

        {/* Action Panel */}
        <div className="p-6 border-b border-white/10">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:border-cyan-500/30 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Command Hub</span>
          </Link>
        </div>

        {/* Saved Itineraries List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Saved Itineraries ({savedItineraries.length})
          </h3>

          {!user ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-gray-400">Please sign in to view saved itineraries.</p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : savedItineraries.length === 0 ? (
            <div className="text-center py-8">
              <Compass className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-gray-500">No saved itineraries found. Plan a trip to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedItineraries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItineraryId(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer flex justify-between items-start group ${
                    selectedItineraryId === item.id
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-300"
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
                    className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                    title="Delete Itinerary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Auth Footer */}
        <div className="p-6 border-t border-white/10 space-y-3">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-gray-200 block truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate block">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer text-center block"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer"
            >
              Sign In with Google
            </button>
          )}

          <div className="flex items-center gap-3 text-[10px] bg-white/5 p-2.5 rounded-lg border border-white/5 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold block text-gray-300">Protocol Secure</span>
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        <header className="px-8 py-4 bg-white/5 border-b border-white/10 backdrop-blur-xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-200 uppercase tracking-wider">
            Travel Architect Saved Database
          </h2>
          {user && (
            <div className="text-xs text-cyan-400 font-semibold">
              Viewing saved files for {user.name}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
          <AnimatePresence mode="wait">
            {!selectedItinerary ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4"
              >
                <Compass className="w-16 h-16 text-cyan-500/20 animate-pulse" />
                <h3 className="text-lg font-bold text-gray-300">No Itinerary Selected</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Select an itinerary from your saved list on the left sidebar to load its daily highlight schedule, financial budget, and routes on the interactive map.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedItinerary.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <ItineraryDisplay plan={selectedItinerary} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
