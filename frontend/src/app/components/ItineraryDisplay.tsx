"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
  MapPin, DollarSign, Calendar, Clock, AlertTriangle, Download, 
  Map, Share2, Briefcase, CheckSquare, Square, CloudSun, Sparkles, Globe 
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import dynamic from "next/dynamic";
import { useAuth } from "./AuthContext";
import { useReactToPrint } from "react-to-print";
import { useTheme } from "./ThemeContext";
import { useCurrency, CURRENCY_SYMBOLS } from "./CurrencyContext";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface Activity {
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
  activities: Activity[];
}

interface BudgetBreakdown {
  flights: number;
  hotel: number;
  food: number;
  transport: number;
  activities: number;
  currency: string;
}

interface ItineraryResponse {
  id?: string;
  destinations: string[];
  duration_days: number;
  itinerary: DailyPlan[];
  total_estimated_cost: number;
  recommendations: string[];
  budget_breakdown?: BudgetBreakdown;
  packing_list?: string[];
  model_version: string;
}

interface ItineraryDisplayProps {
  plan: ItineraryResponse;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  "dubai": [25.2048, 55.2708],
  "abu dhabi": [24.4539, 54.3773],
  "chennai": [13.0827, 80.2707],
  "madurai": [9.9252, 78.1198],
  "singapore": [1.3521, 103.8198],
  "kuala lumpur": [3.1390, 101.6869],
  "tokyo": [35.6762, 139.6503],
  "bangkok": [13.7563, 100.5018]
};

export default function ItineraryDisplay({ plan }: ItineraryDisplayProps) {
  const { currency: preferredCurrency, format: formatCurrency, convert: convertCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const { user, saveItinerary, setShowLoginModal } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "budget" | "pretrip">("timeline");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const { theme, themeClasses } = useTheme();

  // Reset states when plan changes
  useEffect(() => {
    setIsSaved(false);
    setActiveTab("timeline");
    setCheckedItems({});
    
    // Save as active itinerary in localStorage for chatbot context
    if (typeof window !== "undefined") {
      localStorage.setItem("wanderwise_active_itinerary", JSON.stringify(plan));
    }
  }, [plan]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [mapCenter, setMapCenter] = useState<[number, number]>([25.2048, 55.2708]);

  // Geocode active destination or extract first landmark coords
  useEffect(() => {
    for (const day of plan.itinerary) {
      for (const act of day.activities) {
        if (act.latitude && act.longitude) {
          setMapCenter([act.latitude, act.longitude]);
          return;
        }
      }
    }

    const geocodeCity = async () => {
      const city = plan.destinations[0];
      if (!city) return;

      const normalizedCity = city.toLowerCase().trim();
      for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
        if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
          setMapCenter(coords);
          return;
        }
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setMapCenter([lat, lon]);
          }
        }
      } catch (err) {
        console.error("Geocoding failed, falling back to default coordinates", err);
      }
    };
    geocodeCity();
  }, [plan.destinations, plan.itinerary]);

  const mapPins = useMemo(() => {
    const pins: any[] = [];
    
    plan.itinerary.forEach((day) => {
      day.activities.forEach((act, idx) => {
        let coords: [number, number];
        if (act.latitude && act.longitude) {
          coords = [act.latitude, act.longitude];
        } else {
          const hash = act.location.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const latOffset = (((hash + idx * 17) % 80) - 40) / 1000;
          const lngOffset = (((hash * 13 + idx * 23) % 80) - 40) / 1000;
          coords = [mapCenter[0] + latOffset, mapCenter[1] + lngOffset];
        }

        pins.push({
          dayNumber: day.day_number,
          timeOfDay: act.time_of_day,
          location: act.location,
          description: act.description,
          coordinates: coords
        });
      });
    });
    return pins;
  }, [plan, mapCenter]);

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Itinerary-${plan.destinations.join("-")}`,
  });

  const generatePDF = async () => {
    const element = document.getElementById("hidden-print-section");
    if (!element) return;

    // @ts-ignore
    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: 15,
      filename: `Itinerary-${plan.destinations.join("-")}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    html2pdf().from(element).set(opt).save();
  };

  const handleShare = async () => {
    if (!plan.id) return;
    const shareUrl = `${window.location.origin}/trip/${plan.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy link to clipboard", err);
    }
  };

  const handleSave = async () => {
    const breakdown = getBudgetBreakdown();
    const success = await saveItinerary({
      id: plan.id,
      destinations: plan.destinations,
      duration_days: plan.duration_days,
      total_estimated_cost: plan.total_estimated_cost,
      itinerary: plan.itinerary,
      recommendations: plan.recommendations,
      budget_breakdown: breakdown,
      packing_list: getPackingItems(),
      model_version: plan.model_version,
    });
    if (success) {
      setIsSaved(true);
    }
  };

  // Safe getter for budget breakdown supporting backwards compatibility
  const getBudgetBreakdown = (): BudgetBreakdown => {
    const rawBreakdown = plan.budget_breakdown || (plan as any).budget_estimate;
    if (!rawBreakdown) {
      return {
        flights: Math.round(plan.total_estimated_cost * 0.35),
        hotel: Math.round(plan.total_estimated_cost * 0.35),
        food: Math.round(plan.total_estimated_cost * 0.15),
        transport: Math.round(plan.total_estimated_cost * 0.1),
        activities: Math.round(plan.total_estimated_cost * 0.05),
        currency: "USD"
      };
    }
    return {
      flights: rawBreakdown.flights || 0,
      hotel: rawBreakdown.hotel || rawBreakdown.accommodation || 0,
      food: rawBreakdown.food || 0,
      transport: rawBreakdown.transport || rawBreakdown.local_transport || 0,
      activities: rawBreakdown.activities || 0,
      currency: rawBreakdown.currency || "USD"
    };
  };

  // Safe packing list items
  const getPackingItems = (): string[] => {
    return plan.packing_list && plan.packing_list.length > 0
      ? plan.packing_list
      : [
          "Comfortable walking footwear",
          "Breathable active clothing",
          "Sunscreen (SPF 50+) & polarized sunglasses",
          "Universal power adapters & powerbank",
          "Insulated refillable water container",
          "Compact umbrella or light raincoat"
        ];
  };

  // Safe weather/timezone/rates resolver
  const getLocalVibeDetails = () => {
    const city = (plan.destinations[0] || "").toLowerCase().trim();
    if (city.includes("dubai") || city.includes("abu dhabi")) {
      return {
        temp: "34°C / 93°F",
        condition: "Sunny & Hot",
        timezone: "GST (UTC+4)",
        exchange: "1 USD = 3.67 AED",
        tip: "Schedule outdoor plans for mornings or late evenings. Transit pods are fully air-conditioned."
      };
    }
    if (city.includes("singapore")) {
      return {
        temp: "31°C / 88°F",
        condition: "Tropical Humid",
        timezone: "SGT (UTC+8)",
        exchange: "1 USD = 1.35 SGD",
        tip: "Carry rain protection. Smart-city transits are fully covered."
      };
    }
    if (city.includes("tokyo")) {
      return {
        temp: "22°C / 71°F",
        condition: "Cloudy / Moderate",
        timezone: "JST (UTC+9)",
        exchange: "1 USD = 155.20 JPY",
        tip: "Enjoy walks in the smart parks. Use unified IC cards for seamless transits."
      };
    }
    if (city.includes("chennai") || city.includes("madurai")) {
      return {
        temp: "32°C / 89°F",
        condition: "Tropical Breeze",
        timezone: "IST (UTC+5:30)",
        exchange: "1 USD = 83.45 INR",
        tip: "Cotton clothing recommended. Book local transits via verified ride apps."
      };
    }
    return {
      temp: "24°C / 75°F",
      condition: "Clear Sky",
      timezone: "UTC",
      exchange: "1 USD = 1.00 USD",
      tip: "Standard travel safety directives apply."
    };
  };

  const getSafetyDetails = () => {
    const city = (plan.destinations[0] || "").toLowerCase().trim();
    if (city.includes("dubai") || city.includes("abu dhabi")) {
      return {
        police: "999",
        ambulance: "998",
        fire: "997",
        language: "Arabic",
        phrases: [
          { local: "مساعدة (Musaa'adah)", english: "Help" },
          { local: "شكرا (Shukran)", english: "Thank you" },
          { local: "أين المستشفى؟ (Ayna al-mustashfa?)", english: "Where is the hospital?" },
          { local: "شرطة (Shurtah)", english: "Police" }
        ]
      };
    }
    if (city.includes("singapore")) {
      return {
        police: "999",
        ambulance: "995",
        fire: "995",
        language: "Malay / Mandarin",
        phrases: [
          { local: "Tolong! / 救命! (Jiùmìng!)", english: "Help" },
          { local: "Terima Kasih / 谢谢 (Xièxiè)", english: "Thank you" },
          { local: "Di mana hospital? / 医院在哪里?", english: "Where is the hospital?" },
          { local: "Polis / 警察 (Jǐngchá)", english: "Police" }
        ]
      };
    }
    if (city.includes("tokyo")) {
      return {
        police: "110",
        ambulance: "119",
        fire: "119",
        language: "Japanese",
        phrases: [
          { local: "助けて (Tasukete)", english: "Help!" },
          { local: "ありがとう (Arigatou)", english: "Thank you" },
          { local: "病院はどこですか (Byouin wa doko desu ka)", english: "Where is the hospital?" },
          { local: "警察 (Keisatsu)", english: "Police" }
        ]
      };
    }
    if (city.includes("chennai") || city.includes("madurai")) {
      return {
        police: "100",
        ambulance: "108",
        fire: "101",
        language: "Tamil / Hindi",
        phrases: [
          { local: "உதவி (Udhavi) / मदद (Madad)", english: "Help" },
          { local: "நன்றி (Nandri) / धन्यवाद (Dhanyavaad)", english: "Thank you" },
          { local: "மருத்துவமனை எங்கே? / अस्पताल कहाँ है?", english: "Where is the hospital?" },
          { local: "காவல்துறை / पुलिस (Police)", english: "Police" }
        ]
      };
    }
    return {
      police: "112 / 911",
      ambulance: "112 / 911",
      fire: "112 / 911",
      language: "Local Language",
      phrases: [
        { local: "Help", english: "Help" },
        { local: "Thank you", english: "Thank you" },
        { local: "Where is the hospital?", english: "Where is the hospital?" },
        { local: "Police", english: "Police" }
      ]
    };
  };

  const budget = getBudgetBreakdown();
  const chartData = [
    { name: "Flights", value: convertCurrency(budget.flights) },
    { name: "Hotel", value: convertCurrency(budget.hotel) },
    { name: "Food", value: convertCurrency(budget.food) },
    { name: "Transport", value: convertCurrency(budget.transport) },
    { name: "Activities", value: convertCurrency(budget.activities) }
  ].filter(item => item.value > 0);

  // Dynamic Theme Colors for Charts
  const chartColors = {
    solo: ["#06B6D4", "#0EA5E9", "#3B82F6", "#2563EB", "#1D4ED8"],
    couple: ["#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#E9D5FF"],
    team: ["#F59E0B", "#F97316", "#EA580C", "#CA8A04", "#FEF08A"]
  }[theme as "solo" | "couple" | "team"] || ["#06B6D4", "#6366F1", "#EC4899", "#10B981", "#F59E0B"];

  const tabs = [
    { id: "timeline", label: "Itinerary Timeline", icon: Calendar },
    { id: "budget", label: "Budget Analysis", icon: DollarSign },
    { id: "pretrip", label: "Pre-Trip Intelligence", icon: Briefcase }
  ];

  return (
    <div id="itinerary-container-to-print" ref={componentRef} className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 rounded-3xl bg-[#070A13] text-gray-100">
      
      {/* 1. Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Calendar className="w-5 h-5" />
            <span>Smart City Custom Itinerary</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {plan.destinations.join(" & ")}
          </h2>
          <p className="text-gray-400 text-sm">
            Trip Duration: {plan.duration_days} Days | Generated by {plan.model_version}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {user ? (
            <button
              onClick={handleSave}
              disabled={isSaved}
              data-html2canvas-ignore="true"
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                isSaved
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_4px_15px_rgba(6,182,212,0.2)]"
              }`}
            >
              {isSaved ? "Saved to Dashboard" : "Save Itinerary"}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              data-html2canvas-ignore="true"
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Sign In to Save
            </button>
          )}

          {plan.id && (
            <button
              onClick={handleShare}
              data-html2canvas-ignore="true"
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-cyan-500" />
              {shareCopied ? "Link Copied!" : "Share Trip"}
            </button>
          )}

          <button
            onClick={generatePDF}
            data-html2canvas-ignore="true"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <div className="bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider block">
                Total Budget
              </span>
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                {formatCurrency(plan.total_estimated_cost)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Glassmorphic Tabs Navigation */}
      <div data-html2canvas-ignore="true" className="flex gap-2 p-1 bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                isActive ? "text-cyan-400 dark:text-cyan-300" : "text-gray-400 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-lg border border-white/10 shadow-inner"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
          >
            {/* Timeline Left Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Day Selector */}
              <div data-html2canvas-ignore="true" className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin">
                {plan.itinerary.map((day) => (
                  <button
                    key={day.day_number}
                    onClick={() => setSelectedDay(day.day_number)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-300 ${
                      selectedDay === day.day_number
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        : "bg-white/5 border-white/5 hover:border-white/20 text-gray-400 hover:text-white"
                    }`}
                  >
                    Day {day.day_number}
                  </button>
                ))}
              </div>

              {/* Day Details */}
              {plan.itinerary
                .filter((day) => day.day_number === selectedDay)
                .map((day) => (
                  <motion.div
                    key={day.day_number}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                      <h3 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-500/20 rounded text-xs text-indigo-400 uppercase">
                          Focus
                        </span>
                        {day.title}
                      </h3>

                      <div className="relative pl-6 border-l-2 border-white/10 space-y-8">
                        {day.activities.map((act, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.01 }}
                            className="relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-300 group shadow-md"
                          >
                            <span className="absolute -left-[33px] top-6 w-4 h-4 bg-indigo-900 border-2 border-indigo-400 rounded-full group-hover:bg-cyan-400 group-hover:border-cyan-200 transition-all duration-300" />

                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{act.time_of_day}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <span>{act.location}</span>
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                  {act.description}
                                </p>
                              </div>

                              {act.estimated_cost !== null && (
                                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 font-bold text-xs text-emerald-400 flex items-center gap-0.5">
                                  <span>{formatCurrency(act.estimated_cost)}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>

            {/* Sidebar Columns */}
            <div className="lg:col-span-5 space-y-6">
              {/* Map */}
              <div data-html2canvas-ignore="true" className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-200">
                  <Map className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-lg font-bold">Interactive Route Map</h3>
                </div>
                <div className="w-full h-[280px] rounded-xl overflow-hidden relative border border-white/5 bg-slate-950">
                  {mounted && <MapComponent pins={mapPins} center={mapCenter} />}
                </div>
              </div>

              {/* Local Guide Recs */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-lg font-bold text-gray-200">Local Guide Recommendations</h3>
                <ul className="space-y-3">
                  {plan.recommendations.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-300 align-top">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "budget" && (
          <motion.div
            key="budget"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-8"
          >
            {/* Header */}
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                AI Itemized Budget Allocation
              </h3>
              <p className="text-xs text-gray-400">
                Detailed cost allocations generated based on destinations weather, flight databases, and local activity rates.
              </p>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Donut Chart */}
              <div className="bg-white/5 dark:bg-slate-900/30 border border-white/5 rounded-2xl p-5 flex flex-col items-center">
                <h4 className="text-sm font-bold text-gray-200 mb-4 self-start">Expense Allocation (Donut Chart)</h4>
                <div className="w-full h-[260px] flex items-center justify-center">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${CURRENCY_SYMBOLS[preferredCurrency]}${Number(value).toLocaleString()}`, "Estimated Cost"]}
                          contentStyle={{
                            backgroundColor: "rgba(11, 15, 25, 0.95)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "11px"
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          formatter={(value) => <span className="text-[10px] font-bold text-gray-300">{value}</span>} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-gray-500 text-xs animate-pulse">Loading Visualization...</div>
                  )}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white/5 dark:bg-slate-900/30 border border-white/5 rounded-2xl p-5 flex flex-col items-center">
                <h4 className="text-sm font-bold text-gray-200 mb-4 self-start">Cost Breakdown (Bar Chart)</h4>
                <div className="w-full h-[260px]">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          tick={{ fill: "#94a3b8", fontSize: 10 }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip
                          formatter={(value) => [`${CURRENCY_SYMBOLS[preferredCurrency]}${Number(value).toLocaleString()}`, "Estimated Cost"]}
                          contentStyle={{
                            backgroundColor: "rgba(11, 15, 25, 0.95)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "11px"
                          }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-gray-500 text-xs animate-pulse">Loading Visualization...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized list of values */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {chartData.map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">{item.name}</span>
                  <span className="text-lg font-extrabold text-gray-200">{CURRENCY_SYMBOLS[preferredCurrency]}{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "pretrip" && (
          <motion.div
            key="pretrip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full"
          >
            {/* Left Checklist */}
            <div className="md:col-span-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                  Smart Packing Checklist
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  AI-recommended packing list based on the destination's climatology data.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {getPackingItems().map((item, idx) => {
                  const isChecked = !!checkedItems[item];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }))}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 rounded-xl border border-white/5 cursor-pointer transition-colors"
                    >
                      <div className={`p-0.5 rounded transition-colors ${isChecked ? "text-cyan-400" : "text-gray-400"}`}>
                        {isChecked ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
                      </div>
                      <span className={`text-xs transition-all ${isChecked ? "line-through text-gray-500" : "text-gray-200"}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column Stack */}
            <div className="md:col-span-6 flex flex-col gap-6">
              {/* Local Vibe Widget */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
                    Local Vibe Widget
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Destination local metrics synced with local transit gateways.
                  </p>
                </div>

                {(() => {
                  const vibe = getLocalVibeDetails();
                  return (
                    <div className="space-y-4">
                      {/* Temperature */}
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-colors">
                        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
                          <CloudSun className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Weather</span>
                          <span className="text-sm font-bold text-gray-200">{vibe.temp} • {vibe.condition}</span>
                        </div>
                      </div>

                      {/* Timezone */}
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-colors">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Local Timezone</span>
                          <span className="text-sm font-bold text-gray-200">{vibe.timezone}</span>
                        </div>
                      </div>

                      {/* Rates */}
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-colors">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Exchange Rates</span>
                          <span className="text-sm font-bold text-gray-200">{vibe.exchange}</span>
                        </div>
                      </div>

                      {/* Advice block */}
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-300 leading-relaxed font-medium">
                          {vibe.tip}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Local Safety & SOS Widget */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-rose-450 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                    Local Safety & SOS
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Emergency response lines and essential native survival phrases.
                  </p>
                </div>

                {(() => {
                  const safety = getSafetyDetails();
                  return (
                    <div className="space-y-4">
                      {/* Emergency contacts grid */}
                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                          <span className="text-[9px] text-gray-450 uppercase font-bold block mb-1">Police</span>
                          <span className="text-sm font-black text-rose-400">{safety.police}</span>
                        </div>
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                          <span className="text-[9px] text-gray-455 uppercase font-bold block mb-1">Medical</span>
                          <span className="text-sm font-black text-rose-400">{safety.ambulance}</span>
                        </div>
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                          <span className="text-[9px] text-gray-455 uppercase font-bold block mb-1">Fire</span>
                          <span className="text-sm font-black text-rose-400">{safety.fire}</span>
                        </div>
                      </div>

                      {/* Survival Phrases list */}
                      <div className="space-y-2.5 pt-2">
                        <span className="text-[10px] text-gray-455 uppercase font-bold block">
                          Survival Phrases ({safety.language})
                        </span>
                        <div className="divide-y divide-white/5 border-t border-b border-white/5">
                          {safety.phrases.map((phrase, idx) => (
                            <div key={idx} className="flex justify-between py-2 text-xs">
                              <span className="font-bold text-gray-200">{phrase.local}</span>
                              <span className="text-gray-450 italic">{phrase.english}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Print Section */}
      <div
        id="hidden-print-section"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "794px",
          padding: "40px",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
        className="space-y-8"
      >
        <div className="border-b-2 border-slate-200 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SmartCity Tourism AI Itinerary</h1>
            <p className="text-sm text-slate-500 mt-1">Smart City custom travel planner details</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-indigo-600">{formatCurrency(plan.total_estimated_cost)}</div>
            <div className="text-xs text-slate-400">Total Budget ({preferredCurrency})</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase block">Destinations</span>
            <span className="text-slate-800 text-sm font-semibold">{plan.destinations.join(" & ")}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block">Duration</span>
            <span className="text-slate-800 text-sm font-semibold">{plan.duration_days} Days</span>
          </div>
        </div>

        {/* Day-by-Day sequence */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Schedule</h2>
          {plan.itinerary.map((day) => (
            <div key={day.day_number} className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-600">
                Day {day.day_number}: {day.title}
              </h3>
              <div className="space-y-3.5 pl-4 border-l-2 border-slate-200">
                {day.activities.map((act, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{act.time_of_day} - {act.location}</span>
                      {act.estimated_cost !== null && <span>{formatCurrency(act.estimated_cost)}</span>}
                    </div>
                    <p className="text-slate-500 mt-1">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Budget breakdown grid */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Budget Breakdown</h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Expense Category</th>
                <th className="py-2 text-right">Estimated Cost ({preferredCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2">Flights</td>
                <td className="py-2 text-right">{formatCurrency(budget.flights)}</td>
              </tr>
              <tr>
                <td className="py-2">Hotel Accommodation</td>
                <td className="py-2 text-right">{formatCurrency(budget.hotel)}</td>
              </tr>
              <tr>
                <td className="py-2">Food / Dining</td>
                <td className="py-2 text-right">{formatCurrency(budget.food)}</td>
              </tr>
              <tr>
                <td className="py-2">Local Transport</td>
                <td className="py-2 text-right">{formatCurrency(budget.transport)}</td>
              </tr>
              <tr>
                <td className="py-2">Activities</td>
                <td className="py-2 text-right">{formatCurrency(budget.activities)}</td>
              </tr>
              <tr className="font-bold text-slate-900 border-t-2 border-slate-200">
                <td className="py-2">Total Estimated Cost</td>
                <td className="py-2 text-right">{formatCurrency(plan.total_estimated_cost)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Packing items */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Recommended Packing List</h2>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            {getPackingItems().map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="space-y-2 pb-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Local Recommendations</h2>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            {plan.recommendations.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
          Generated via SmartCity Tourism AI Platform Smart Travel Assistant • Powered by {plan.model_version}
        </div>
      </div>
    </div>
  );
}
