"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface ReviewSentimentProps {
  originalText: string;
  sentimentLabel: string;
  polarityScore: number;
  confidenceMetrics: {
    subjectivity: number;
  };
}

export default function ReviewSentiment({
  originalText,
  sentimentLabel,
  polarityScore,
  confidenceMetrics,
}: ReviewSentimentProps) {
  // Determine color theme based on sentiment
  const isPositive = sentimentLabel === "Positive";
  const isNegative = sentimentLabel === "Negative";

  const theme = isPositive
    ? {
        border: "border-emerald-500/40 hover:border-emerald-400/80",
        bg: "bg-emerald-950/20",
        text: "text-emerald-400",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
        icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
      }
    : isNegative
    ? {
        border: "border-rose-500/40 hover:border-rose-400/80",
        bg: "bg-rose-950/20",
        text: "text-rose-400",
        glow: "shadow-[0_0_20px_rgba(244,63,94,0.25)]",
        icon: <AlertCircle className="w-6 h-6 text-rose-400" />,
      }
    : {
        border: "border-cyan-500/40 hover:border-cyan-400/80",
        bg: "bg-cyan-950/20",
        text: "text-cyan-400",
        glow: "shadow-[0_0_20px_rgba(6,182,212,0.25)]",
        icon: <HelpCircle className="w-6 h-6 text-cyan-400" />,
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} ${theme.glow} backdrop-blur-xl p-6 transition-all duration-300`}
    >
      {/* Decorative top glow bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          isPositive
            ? "from-emerald-500 to-teal-400"
            : isNegative
            ? "from-rose-500 to-orange-400"
            : "from-cyan-500 to-blue-400"
        }`}
      />

      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          {theme.icon}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              NLP Analysis Result
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className={`text-2xl font-bold tracking-tight ${theme.text}`}>
                {sentimentLabel} Sentiment
              </h3>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-sm italic text-gray-300 leading-relaxed">
              &ldquo;{originalText}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-gray-400">Polarity Score</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isPositive
                        ? "bg-emerald-500"
                        : isNegative
                        ? "bg-rose-500"
                        : "bg-cyan-500"
                    }`}
                    style={{
                      width: `${((polarityScore + 1) / 2) * 100}%`,
                    }}
                  />
                </div>
                <span className={`text-sm font-semibold ${theme.text}`}>
                  {polarityScore > 0 ? "+" : ""}
                  {polarityScore.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400">Subjectivity Score</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${confidenceMetrics.subjectivity * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-indigo-300">
                  {confidenceMetrics.subjectivity.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
