"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TripService } from "../../../lib/db";
import { SavedItinerary } from "../../components/AuthContext";
import ItineraryDisplay from "../../components/ItineraryDisplay";
import { useAuth } from "../../components/AuthContext";
import { useTheme } from "../../components/ThemeContext";
import { 
  Sparkles, Compass, AlertTriangle, ArrowRight, Loader2, 
  MapPin, Heart, Share2, ShieldCheck, UserCheck 
} from "lucide-react";
import { motion } from "framer-motion";

export default function SharedTripPage() {
  const params = useParams();
  const router = useRouter();
  const { user, login } = useAuth();
  const { themeClasses } = useTheme();

  const id = params.id as string;
  const [trip, setTrip] = useState<SavedItinerary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSharedTrip() {
      if (!id) return;
      try {
        const data = await TripService.getTripById(id);
        setTrip(data);
      } catch (err) {
        console.error("Failed to load shared trip", err);
      } finally {
        setLoading(false);
      }
    }
    loadSharedTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-130px)] px-6 py-12 bg-slate-50 dark:bg-transparent transition-colors duration-300">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <h3 className="text-sm font-extrabold tracking-wider uppercase text-slate-500 dark:text-gray-400">
            Decoding Itinerary Package...
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 max-w-xs mx-auto">
            Retrieving smart route parameters and budget allocations.
          </p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-130px)] px-6 py-12 bg-slate-50 dark:bg-transparent transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-2xl max-w-md w-full shadow-xl text-center space-y-6"
        >
          <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full w-fit mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 dark:text-gray-100">Itinerary Not Found</h3>
            <p className="text-xs text-slate-400 dark:text-gray-400 leading-relaxed">
              We couldn't resolve the travel plan with ID: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded font-mono text-[10px] text-indigo-500">{id}</code>.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-left text-[11px] leading-relaxed space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[9px] text-amber-500">Developer Note: LocalStorage Fallback</span>
            <p>
              Because database credentials (Supabase/Firebase/Prisma) are not configured, this itinerary is cached in the creator's local browser storage and cannot be fetched across different machines yet.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/explore"
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer ${themeClasses.btn}`}
            >
              <span>Build a New Itinerary</span>
              <Compass className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8 md:px-12 bg-slate-50 dark:bg-transparent transition-colors duration-300">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Sign-up CTA Banner for non-logged-in users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-5 bg-gradient-to-r from-cyan-600/10 via-indigo-600/10 to-pink-600/10 border border-indigo-500/20 rounded-2xl shadow-sm text-center md:text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl hidden sm:block">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                  Shared AI Journey Map
                </span>
                <span className="text-xs text-slate-600 dark:text-gray-300 font-medium">
                  Enjoying this itinerary? Sign in with Google to save this trip or build your own customized paths.
                </span>
              </div>
            </div>
            
            <button
              onClick={login}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
            >
              <span>Sign In & Save Trip</span>
              <UserCheck className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Header Title */}
        <div className="flex items-center gap-2 pl-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
            Viewing Shared Route Planner
          </span>
        </div>

        {/* Read-Only Itinerary Display */}
        <ItineraryDisplay plan={trip} />
      </div>
    </div>
  );
}
