"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MapPin, DollarSign, Calendar, Clock, AlertTriangle, Download, Map } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import dynamic from "next/dynamic";
import { useAuth } from "./AuthContext";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface Activity {
  time_of_day: string;
  description: string;
  location: string;
  estimated_cost: number | null;
}

interface DailyPlan {
  day_number: number;
  title: string;
  activities: Activity[];
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

interface ItineraryDisplayProps {
  plan: ItineraryResponse;
}

const COLORS = ["#06B6D4", "#6366F1", "#EC4899", "#10B981", "#F59E0B"];

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

const getCoordinatesForLocation = (locationName: string, city: string, index: number): [number, number] => {
  const normalizedCity = city.toLowerCase().trim();
  let base: [number, number] = [25.2048, 55.2708];
  
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      base = coords;
      break;
    }
  }

  const hash = locationName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = (((hash + index * 17) % 80) - 40) / 1000;
  const lngOffset = (((hash * 13 + index * 23) % 80) - 40) / 1000;
  
  return [base[0] + latOffset, base[1] + lngOffset];
};

export default function ItineraryDisplay({ plan }: ItineraryDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const { user, saveItinerary, setShowLoginModal } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  // Reset isSaved state when plan changes
  useEffect(() => {
    setIsSaved(false);
  }, [plan]);

  const handleSave = () => {
    const success = saveItinerary({
      destinations: plan.destinations,
      duration_days: plan.duration_days,
      total_estimated_cost: plan.total_estimated_cost,
      itinerary: plan.itinerary,
      recommendations: plan.recommendations,
      budget_estimate: plan.budget_estimate,
      model_version: plan.model_version,
    });
    if (success) {
      setIsSaved(true);
    }
  };

  // Set mounted to true on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  const mapPins = useMemo(() => {
    const pins: any[] = [];
    const mainCity = plan.destinations[0] || "Dubai";
    
    plan.itinerary.forEach((day) => {
      day.activities.forEach((act, idx) => {
        pins.push({
          dayNumber: day.day_number,
          timeOfDay: act.time_of_day,
          location: act.location,
          description: act.description,
          coordinates: getCoordinatesForLocation(act.location, act.location.includes(",") ? act.location.split(",")[1] : mainCity, idx + day.day_number)
        });
      });
    });
    return pins;
  }, [plan]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapPins.length > 0) {
      return mapPins[0].coordinates;
    }
    const mainCity = plan.destinations[0] || "Dubai";
    const normalizedCity = mainCity.toLowerCase().trim();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
        return coords;
      }
    }
    return [25.2048, 55.2708];
  }, [mapPins, plan.destinations]);

  const downloadPDF = async () => {
    const element = document.getElementById("itinerary-container-to-export");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#070A13",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Itinerary-${plan.destinations.join("-")}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  // Compute budget breakdown for the chart
  const getBudgetBreakdown = () => {
    const categories: Record<string, number> = {};
    let noCostCount = 0;
    
    plan.itinerary.forEach((day) => {
      day.activities.forEach((act) => {
        const cost = act.estimated_cost || 0;
        if (cost === 0) noCostCount++;
        // Classify category based on time of day
        const cat = act.time_of_day || "Other";
        categories[cat] = (categories[cat] || 0) + cost;
      });
    });

    const data = Object.keys(categories).map((key) => ({
      name: `${key} Activities`,
      value: parseFloat(categories[key].toFixed(2)),
    })).filter(item => item.value > 0);

    // If all activities are free, provide a dummy dataset
    if (data.length === 0) {
      return [{ name: "Free Attractions", value: 1 }];
    }
    return data;
  };

  const chartData = getBudgetBreakdown();

  return (
    <div id="itinerary-container-to-export" className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl mx-auto p-4 rounded-3xl bg-[#070A13]">
      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-12 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
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
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Sign In to Save
            </button>
          )}

          <button
            onClick={downloadPDF}
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
                ${plan.total_estimated_cost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Vertical Itinerary Timeline */}
      <div className="lg:col-span-7 space-y-6">
        {/* Day Selector tabs */}
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

        {/* Selected Day Timeline */}
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
                      {/* Timeline Dot Indicator */}
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
                            <DollarSign className="w-3 h-3" />
                            <span>{act.estimated_cost}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

        {/* Budget Estimate Card */}
        {plan.budget_estimate && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4"
          >
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              Comprehensive Budget Estimator
            </h3>
            <p className="text-xs text-gray-400">
              Estimated itemized expenses for {plan.destinations.join(" & ")} over {plan.duration_days} days.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1 hover:border-cyan-500/20 transition-all duration-300">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Flights / Transit</span>
                <span className="text-lg font-bold text-gray-200">${plan.budget_estimate.flights.toLocaleString()}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1 hover:border-cyan-500/20 transition-all duration-300">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Accommodation</span>
                <span className="text-lg font-bold text-gray-200">${plan.budget_estimate.accommodation.toLocaleString()}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1 hover:border-cyan-500/20 transition-all duration-300">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Food & Dining</span>
                <span className="text-lg font-bold text-gray-200">${plan.budget_estimate.food.toLocaleString()}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1 hover:border-cyan-500/20 transition-all duration-300">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Local Transport</span>
                <span className="text-lg font-bold text-gray-200">${plan.budget_estimate.local_transport.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
              <span className="text-xs font-semibold text-gray-300">Total Sum of Estimated Itemized Expenses</span>
              <span className="text-xl font-extrabold text-cyan-400">
                ${(
                  plan.budget_estimate.flights +
                  plan.budget_estimate.accommodation +
                  plan.budget_estimate.food +
                  plan.budget_estimate.local_transport
                ).toLocaleString()} {plan.budget_estimate.currency}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sidebar: Budget Breakdown & Recommendations */}
      <div className="lg:col-span-5 space-y-6">
        {/* Recharts Budget Visualization Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4 self-start text-gray-200">
            Cost Allocation
          </h3>
          <div className="w-full h-[220px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(11, 15, 25, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                Loading Visualizer...
              </div>
            )}
          </div>
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-4 mt-2 w-full text-xs">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-gray-400 truncate">{item.name}</span>
                <span className="font-bold text-gray-200 ml-auto">
                  {item.value > 1 ? `$${item.value}` : "Free"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Card */}
        <div data-html2canvas-ignore="true" className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gray-200">
            <Map className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold">Interactive Route Map</h3>
          </div>
          <div className="w-full h-[280px] rounded-xl overflow-hidden relative border border-white/5 bg-slate-950">
            {mounted && <MapComponent pins={mapPins} center={mapCenter} />}
          </div>
        </div>

        {/* Smart City Tips/Recommendations */}
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
    </div>
  );
}
