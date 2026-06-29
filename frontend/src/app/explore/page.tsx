"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Compass, FileText } from "lucide-react";
import ItineraryDisplay from "../components/ItineraryDisplay";
import ReviewSentiment from "../components/ReviewSentiment";
import { useAuth } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { TripService } from "../../lib/db";

interface ActivityItem {
  time_of_day: string;
  description: string;
  location: string;
  estimated_cost: number | null;
  latitude?: number;
  longitude?: number;
}

interface DailyPlan {
  day_number: number;
  title: string;
  activities: ActivityItem[];
}

interface BudgetEstimate {
  flights: number;
  accommodation: number;
  food: number;
  local_transport: number;
  currency: string;
}

interface ItineraryResponse {
  id?: string;
  destinations: string[];
  duration_days: number;
  itinerary: DailyPlan[];
  total_estimated_cost: number;
  recommendations: string[];
  budget_estimate?: BudgetEstimate;
  model_version: string;
}

interface SentimentResponse {
  original_text: string;
  sentiment_label: string;
  polarity_score: number;
  confidence_metrics: {
    subjectivity: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ExplorePage() {
  const { themeClasses } = useTheme();

  // AI Planner States
  const [destinations, setDestinations] = useState("Dubai, Abu Dhabi");
  const [duration, setDuration] = useState(3);
  const [preferences, setPreferences] = useState("smart city parks, historical museums, autonomous transport");
  const [budgetTier, setBudgetTier] = useState("Moderate");
  const [travelersCount, setTravelersCount] = useState(2);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<ItineraryResponse | null>(null);

  // Reviews NLP States
  const [reviewText, setReviewText] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [sentimentResult, setSentimentResult] = useState<SentimentResponse | null>(null);

  const handleGenerateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlannerLoading(true);
    setPlannerError(null);
    setGeneratedPlan(null);

    const payload = {
      destinations: destinations.split(",").map((d) => d.trim()),
      duration_days: duration,
      preferences: preferences.split(",").map((p) => p.trim()),
      budget_tier: budgetTier,
      travelers_count: travelersCount,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ai-planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to generate itinerary.");
      }

      const data: ItineraryResponse = await res.json();
      
      // Assign UUID and auto-save anonymously
      const tripId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const planWithId = {
        ...data,
        id: tripId,
      };

      await TripService.saveTrip(planWithId);
      setGeneratedPlan(planWithId);
    } catch (err: any) {
      setPlannerError(err.message || "Something went wrong.");
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleAnalyzeSentiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || reviewText.length < 3) {
      setReviewsError("Review text must be at least 3 characters long.");
      return;
    }

    setReviewsLoading(true);
    setReviewsError(null);
    setSentimentResult(null);

    const payload = {
      review_text: reviewText,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reviews/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to analyze review sentiment.");
      }

      const data: SentimentResponse = await res.json();
      setSentimentResult(data);
    } catch (err: any) {
      setReviewsError(err.message || "Something went wrong.");
    } finally {
      setReviewsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-thin z-10 relative max-w-6xl mx-auto w-full"
    >
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
          AI Itinerary Generator
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Craft instant, hyper-personalized travel itineraries dynamically tailored to your budget, style, and travel companions.
        </p>
      </div>

      {/* Main planner block */}
      <div className={`bg-white/10 ${themeClasses.border} ${themeClasses.rounded} p-8 backdrop-blur-md shadow-2xl relative overflow-hidden`}>
        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${themeClasses.text}`}>
          <Compass className="w-5 h-5" />
          <span>Configure Travel Architect parameters</span>
        </h3>

        <form onSubmit={handleGenerateItinerary} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs text-gray-400 font-semibold block">Destinations (Comma-separated)</label>
            <input
              type="text"
              value={destinations}
              onChange={(e) => setDestinations(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-xs text-gray-400 font-semibold block">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={14}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-xs text-gray-400 font-semibold block">Travelers Count</label>
            <input
              type="number"
              min={1}
              value={travelersCount}
              onChange={(e) => setTravelersCount(parseInt(e.target.value) || 1)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="md:col-span-8 space-y-2">
            <label className="text-xs text-gray-400 font-semibold block">Preferences (Comma-separated)</label>
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="md:col-span-4 space-y-2">
            <label className="text-xs text-gray-400 font-semibold block">Budget Tier</label>
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="Economy">Economy</option>
              <option value="Moderate">Moderate</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          <div className="md:col-span-12 flex justify-end mt-4">
            <button
              type="submit"
              disabled={plannerLoading}
              className={`px-6 py-3 flex items-center gap-2 font-bold cursor-pointer transition-all duration-300 ${themeClasses.btn}`}
            >
              {plannerLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling AI Itinerary...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Generate Itinerary</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {plannerError && (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-400 block text-sm">Failed to generate itinerary</span>
            <p className="text-gray-300 text-xs mt-1">{plannerError}</p>
          </div>
        </div>
      )}

      {/* Generated Display */}
      {generatedPlan && <ItineraryDisplay plan={generatedPlan} />}

      {/* NLP Sentiment Tagging Panel */}
      <div className={`bg-white/10 ${themeClasses.border} ${themeClasses.rounded} p-8 backdrop-blur-md shadow-2xl max-w-2xl mx-auto w-full`}>
        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${themeClasses.text}`}>
          <FileText className="w-5 h-5" />
          <span>NLP Review Sentiment Classifier</span>
        </h3>
        <form onSubmit={handleAnalyzeSentiment} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-semibold block">Write visitor feedback</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="E.g., The museum tour was excellent, but the transport had a long delay."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Min. 3 characters. Current: {reviewText.length}
            </span>
            <button
              type="submit"
              disabled={reviewsLoading}
              className={`px-6 py-3 flex items-center gap-2 font-bold cursor-pointer transition-all duration-300 ${themeClasses.btn}`}
            >
              {reviewsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing NLP...</span>
                </>
              ) : (
                <span>Analyze Review Text</span>
              )}
            </button>
          </div>
        </form>

        {reviewsError && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 mt-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400 block text-sm">NLP error</span>
              <p className="text-gray-300 text-xs mt-1">{reviewsError}</p>
            </div>
          </div>
        )}

        {sentimentResult && (
          <div className="mt-6">
            <ReviewSentiment
              originalText={sentimentResult.original_text}
              sentimentLabel={sentimentResult.sentiment_label}
              polarityScore={sentimentResult.polarity_score}
              confidenceMetrics={sentimentResult.confidence_metrics}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
