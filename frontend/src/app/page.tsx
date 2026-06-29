"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "./components/ThemeContext";
import { Compass, Map, DollarSign, Brain, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { themeClasses } = useTheme();

  const features = [
    {
      title: "Generative AI Architect",
      desc: "Instantly draft day-by-day itineraries tailored to your specific companions and pacing.",
      icon: Compass,
      color: "text-cyan-400",
    },
    {
      title: "Landmark Interactive Maps",
      desc: "Explore dynamic route routing overlays and geopins directly connected to OpenStreetMap.",
      icon: Map,
      color: "text-indigo-400",
    },
    {
      title: "Budget & Cost Estimations",
      desc: "Retrieve instant cost estimates for hotel stays, transit, meals, and flight bookings.",
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      title: "NLP Sentiment Analysis",
      desc: "Synthesize and classify traveler review sentiment using Natural Language Processing.",
      icon: Brain,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden min-h-[calc(100vh-130px)] px-6 py-12 md:px-12">
      {/* Immersive Video Background with Dark Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105 opacity-20 filter blur-[1px]"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-downtown-tokyo-intersection-at-night-42287-large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/90 to-slate-950" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-12">
        {/* Hero Copy */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight"
          >
            Discover Your Next{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400">
              Journey
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm md:text-lg text-gray-300 max-w-2xl mx-auto font-medium"
          >
            An AI-powered smart tourism ecosystem that creates personalized travel itineraries, estimates budgets, and charts maps instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="pt-4"
          >
            <Link
              href="/explore"
              className={`inline-flex items-center gap-2 px-8 py-4 text-sm font-extrabold tracking-wider transition-all duration-300 transform hover:scale-[1.03] active:scale-95 cursor-pointer ${themeClasses.btn}`}
            >
              <span>Start Planning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`bg-white/10 ${themeClasses.border} ${themeClasses.rounded} p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300 group flex gap-4`}
              >
                <div className={`p-3 bg-white/5 border border-white/5 rounded-xl shrink-0 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-200 text-sm mb-1 group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
