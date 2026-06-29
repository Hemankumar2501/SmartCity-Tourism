"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  FileText,
  ShieldCheck,
  Cpu,
  Activity,
  Navigation,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import ChatWindow from "./components/ChatWindow";
import ItineraryDisplay from "./components/ItineraryDisplay";
import ReviewSentiment from "./components/ReviewSentiment";

// Types corresponding to FastAPI response
interface ActivityItem {
  time_of_day: string;
  description: string;
  location: string;
  estimated_cost: number | null;
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

export default function page() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "planner" | "reviews">("dashboard");

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
      setGeneratedPlan(data);
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
              City Command Center
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-6 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Operational Hub</span>
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "planner"
                ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>AI Itinerary Planner</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "reviews"
                ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>NLP Review Tagging</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-6 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-gray-400 block font-semibold">Security Level</span>
              <span className="text-gray-200">Protocol Secure</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        {/* Top Header */}
        <header className="px-8 py-4 bg-white/5 border-b border-white/10 backdrop-blur-xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-200 uppercase tracking-wider">
            {activeTab === "dashboard"
              ? "Operation Metrics Dashboard"
              : activeTab === "planner"
              ? "Generative AI Travel Architect"
              : "NLP Sentiment Classification Engine"}
          </h2>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>FastAPI Link: Active</span>
            </span>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
          <AnimatePresence mode="wait">
            {/* Dashboard Operational Hub */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Pods Operational</span>
                      <span className="text-xl font-bold">142 / 150</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Active Tourists</span>
                      <span className="text-xl font-bold">12,482</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <Navigation className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Grid Utility Load</span>
                      <span className="text-xl font-bold">42% (Solar)</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Anomaly Flags</span>
                      <span className="text-xl font-bold text-emerald-400">Clear</span>
                    </div>
                  </div>
                </div>

                {/* Main operational column split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="text-lg font-bold text-gray-200">Autonomous Transit System Status</h3>
                    <div className="h-64 bg-slate-900/30 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10" />
                      <div className="text-center z-10 space-y-2">
                        <Activity className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                        <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">
                          Smart Transit Radar Live
                        </span>
                        <p className="text-sm text-gray-300 max-w-sm">
                          Autonomous shuttle fleets are dynamically adapting routes to accommodate high-density tour groups near historical landmarks.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    <ChatWindow />
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Travel Planner Panel */}
            {activeTab === "planner" && (
              <motion.div
                key="planner"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Form to submit parameters */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-lg font-bold mb-6 text-cyan-400">Generate Travel Architect Draft</h3>
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
                      <label className="text-xs text-gray-400 font-semibold block">Trip Duration (Days)</label>
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
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
                        onChange={(e) => setTravelersCount(parseInt(e.target.value))}
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
                      <label className="text-xs text-gray-400 font-semibold block">Budget Level</label>
                      <select
                        value={budgetTier}
                        onChange={(e) => setBudgetTier(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="Budget" className="bg-[#070A13]">Budget Friendly</option>
                        <option value="Moderate" className="bg-[#070A13]">Moderate/Comfort</option>
                        <option value="Luxury" className="bg-[#070A13]">Luxury Tier</option>
                      </select>
                    </div>

                    <div className="md:col-span-12 flex justify-end">
                      <button
                        type="submit"
                        disabled={plannerLoading}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_4px_20px_rgba(6,182,212,0.2)]"
                      >
                        {plannerLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Compiling AI Itinerary...</span>
                          </>
                        ) : (
                          <span>Generate Travel Draft</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Error Banner */}
                {plannerError && (
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-400 block text-sm">Failed to generate itinerary</span>
                      <p className="text-gray-300 text-xs mt-1">{plannerError}</p>
                    </div>
                  </div>
                )}

                {/* Generated Display */}
                {generatedPlan && <ItineraryDisplay plan={generatedPlan} />}
              </motion.div>
            )}

            {/* NLP Sentiment Tagging Panel */}
            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Form to submit review */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold mb-6 text-indigo-400">Review NLP Sentiment Classifier</h3>
                  <form onSubmit={handleAnalyzeSentiment} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold block">Write or paste visitor feedback</label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="E.g., The museum tour was excellent, but the autonomous pod had a long delay."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">
                        Min. 3 characters. Current length: {reviewText.length}
                      </span>
                      <button
                        type="submit"
                        disabled={reviewsLoading}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.2)]"
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
                </div>

                {/* Error Banner */}
                {reviewsError && (
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3 max-w-2xl mx-auto">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-400 block text-sm">Sentiment Analysis Error</span>
                      <p className="text-gray-300 text-xs mt-1">{reviewsError}</p>
                    </div>
                  </div>
                )}

                {/* Sentiment output card */}
                {sentimentResult && (
                  <ReviewSentiment
                    originalText={sentimentResult.original_text}
                    sentimentLabel={sentimentResult.sentiment_label}
                    polarityScore={sentimentResult.polarity_score}
                    confidenceMetrics={sentimentResult.confidence_metrics}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
