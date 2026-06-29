"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Bot, User, Sparkles, Volume2, Wifi } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ChatWindow() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Welcome to the Mega-Tourism Command Center! I am your AI concierge. Ask me about autonomous shuttle timings, smart park attractions, or custom dining bookings.",
      timestamp: new Date("2026-06-28T22:00:00"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const textToSend = input.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);

    // 1) Append the user's message immediately
    const userMsg: Message = {
      id: Date.now().toString() + "-user",
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // 2) Show an animated "thinking" indicator bubble
    const loadingId = Date.now().toString() + "-loading";
    const loadingMsg: Message = {
      id: loadingId,
      sender: "bot",
      text: "",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      // ── Dynamic NLP-lite parsing of free-form text ──
      const destinations = textToSend.includes(",")
        ? textToSend.split(",").map((d) => d.trim()).filter(Boolean)
        : [textToSend.trim()];

      let duration_days = 3;
      const dayMatch = textToSend.match(/(\d+)\s*day/i);
      if (dayMatch) {
        const val = parseInt(dayMatch[1], 10);
        if (val >= 1 && val <= 14) {
          duration_days = val;
        }
      }

      let budget_tier = "Moderate";
      if (/luxury/i.test(textToSend)) {
        budget_tier = "Luxury";
      } else if (/budget/i.test(textToSend)) {
        budget_tier = "Budget";
      }

      let travelers_count = 2;
      const travelersMatch = textToSend.match(
        /(\d+)\s*(traveler|people|person|guest)/i
      );
      if (travelersMatch) {
        travelers_count = Math.max(1, parseInt(travelersMatch[1], 10));
      }

      // Build preferences dynamically from keywords
      const prefKeywords: Record<string, string> = {
        park: "smart city parks",
        shuttle: "autonomous transit",
        food: "culinary experiences",
        dining: "culinary experiences",
        museum: "museums & galleries",
        adventure: "adventure sports",
        history: "historical sites",
        culture: "cultural immersion",
        beach: "beach & waterfront",
        shopping: "shopping districts",
        night: "nightlife & entertainment",
      };
      const detectedPrefs = Object.entries(prefKeywords)
        .filter(([kw]) => new RegExp(kw, "i").test(textToSend))
        .map(([, pref]) => pref);
      const preferences =
        detectedPrefs.length > 0
          ? [...new Set(detectedPrefs)]
          : ["smart city parks", "autonomous transit"];

      const payload = {
        destinations,
        duration_days,
        preferences,
        budget_tier,
        travelers_count,
      };

      // 3) POST to the FastAPI backend
      const res = await fetch(
        `${API_BASE_URL}/api/v1/ai-planner/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          detail = errData.detail || detail;
        } catch {
          /* non-json error body */
        }
        throw new Error(detail);
      }

      const data = await res.json();

      // 4) Format the dynamic itinerary response
      const dayLines = (data.itinerary ?? [])
        .map((day: any) => {
          const activities = (day.activities ?? [])
            .map(
              (a: any) =>
                `   🕐 ${a.time_of_day}: ${a.description} @ ${a.location}${a.estimated_cost != null ? ` (~$${a.estimated_cost})` : ""}`
            )
            .join("\n");
          return `📅 Day ${day.day_number} — ${day.title}\n${activities}`;
        })
        .join("\n\n");

      const recs = (data.recommendations ?? [])
        .map((rec: string) => `  • ${rec}`)
        .join("\n");

      const formattedResponse = [
        `🌍 Your Custom ${data.duration_days}-Day Itinerary`,
        `📍 Destinations: ${(data.destinations ?? destinations).join(" & ")}`,
        `💰 Estimated Total: $${Number(data.total_estimated_cost ?? 0).toFixed(2)} (${budget_tier})`,
        `👥 Travelers: ${travelers_count}`,
        ``,
        dayLines,
        ``,
        `💡 Smart Concierge Tips:`,
        recs,
        ``,
        `🤖 Model: ${data.model_version ?? "N/A"}`,
      ].join("\n");

      // Replace the loading bubble with the real response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                text: formattedResponse,
                timestamp: new Date(),
                isLoading: false,
              }
            : msg
        )
      );
    } catch (error: any) {
      console.error("ChatWindow fetch error:", error);
      const errorMsg = `⚠️ Concierge Error: Could not reach the AI Planner service.\n\nPlease verify the FastAPI backend is running at:\n${API_BASE_URL}\n\nDetails: ${error.message || error}`;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                text: errorMsg,
                timestamp: new Date(),
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsSending(false);
      // Refocus the input for the next query
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Mock voice input text insertion after a delay
      setTimeout(() => {
        setInput("Dubai, Abu Dhabi, 5 days, luxury");
        setIsRecording(false);
        inputRef.current?.focus();
      }, 2500);
    }
  };

  // ── Typing-indicator dots ──
  const TypingIndicator = () => (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-cyan-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="text-xs text-gray-400 ml-2">
        Generating itinerary…
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-[500px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0B0F19]" />
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
              Smart Concierge
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-cyan-400 animate-pulse" />
              Connected to City Grid
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md border border-white/5 text-gray-400">
            v2.4-active
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "justify-end" : ""
              }`}
            >
              {msg.sender === "bot" && (
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed border ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 border-cyan-500 text-white rounded-tr-none shadow-[0_4px_12px_rgba(6,182,212,0.15)]"
                    : "bg-white/5 border-white/10 text-gray-200 rounded-tl-none"
                }`}
              >
                {msg.isLoading ? (
                  <TypingIndicator />
                ) : (
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                )}
                <span className="text-[9px] text-gray-400 block mt-1 text-right">
                  {mounted
                    ? msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <div className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-3">
        {/* Voice Input Mockup Button */}
        <div className="relative">
          <button
            onClick={toggleRecording}
            disabled={isSending}
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isRecording
                ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
            title={isRecording ? "Listening..." : "Start Voice Input"}
          >
            <Mic className="w-5 h-5" />
          </button>
          {isRecording && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-rose-500 text-white text-[10px] rounded font-bold whitespace-nowrap">
              Listening...
            </span>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={
            isSending
              ? "Generating your itinerary…"
              : isRecording
                ? "Speak now..."
                : "Ask your AI travel guide..."
          }
          disabled={isRecording || isSending}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
        />

        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isSending}
          className={`p-3 rounded-xl transition-all duration-300 disabled:cursor-not-allowed ${
            isSending
              ? "bg-cyan-500/30 text-cyan-300 animate-pulse"
              : "bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 text-white"
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
