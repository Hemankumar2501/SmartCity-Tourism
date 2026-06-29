"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Bot, Send, Sparkles, X, Wifi, User, Clock, Trash2, ArrowRight } from "lucide-react";
import { TripService } from "../../lib/db";
import { useTheme } from "./ThemeContext";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function WanderBot() {
  const pathname = usePathname();
  const { theme, themeClasses } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hi there! I'm WanderBot, your smart travel concierge. How can I help you customize or explore your travel itineraries today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeItinerary, setActiveItinerary] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Context loading: Load active itinerary dynamically
  useEffect(() => {
    async function resolveActiveContext() {
      // 1. If on dynamic trip page, fetch by ID
      if (pathname.startsWith("/trip/")) {
        const parts = pathname.split("/");
        const tripId = parts[parts.length - 1];
        if (tripId) {
          const trip = await TripService.getTripById(tripId);
          if (trip) {
            setActiveItinerary(trip);
            return;
          }
        }
      }

      // 2. Fallback: check localStorage for last active/viewed itinerary
      const saved = localStorage.getItem("wanderwise_active_itinerary");
      if (saved) {
        try {
          setActiveItinerary(JSON.parse(saved));
          return;
        } catch {
          // ignore
        }
      }

      setActiveItinerary(null);
    }
    
    if (isOpen) {
      resolveActiveContext();
    }
  }, [pathname, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInput("");

    // Append user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Format history payload
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          itinerary: activeItinerary,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to reach WanderBot server.");
      }

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bot",
        text: data.response || "I couldn't process that query. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bot",
        text: "⚠️ Concierge System Offline: I'm having trouble connecting to the AI services. Please verify your internet connection.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: "Chat history cleared. How can I assist you with your travels now?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="mb-4 w-80 sm:w-96 h-[460px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between text-slate-800 dark:text-gray-100"
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-100/50 dark:bg-slate-950/45 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-700 dark:text-gray-200 flex items-center gap-1">
                    WanderBot Concierge
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                  </h3>
                  <span className="text-[9px] text-slate-400 dark:text-gray-500 flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5 text-emerald-500" />
                    {activeItinerary ? `Context: ${activeItinerary.destinations[0]}` : "Awaiting itinerary context"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChat}
                  title="Clear Chat History"
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chatbot System Notice if context is loaded */}
            {activeItinerary && (
              <div className="px-4 py-1.5 bg-indigo-500/5 border-b border-indigo-500/10 text-[10px] text-indigo-600 dark:text-indigo-300 flex items-center justify-between">
                <span>Itinerary context loaded dynamically.</span>
                <span className="font-bold">{activeItinerary.destinations.join(" & ")}</span>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : ""}`}
                >
                  {msg.sender === "bot" && (
                    <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-xl p-3 text-xs leading-relaxed border ${
                      msg.sender === "user"
                        ? "bg-gradient-to-tr from-cyan-600 to-indigo-600 border-cyan-500 text-white rounded-tr-none shadow-[0_4px_12px_rgba(6,182,212,0.1)]"
                        : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-gray-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className="text-[8px] text-slate-400 dark:text-gray-500 block mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {msg.sender === "user" && (
                    <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0">
                    <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 bg-slate-100/50 dark:bg-slate-950/45 border-t border-slate-200 dark:border-white/5 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isSending ? "WanderBot is thinking..." : "Ask WanderBot travel queries..."}
                disabled={isSending}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className={`p-2.5 rounded-xl text-white shadow-md transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === "team" ? "bg-amber-600 hover:bg-amber-500" : 
                  theme === "couple" ? "bg-purple-600 hover:bg-purple-500" :
                  "bg-cyan-600 hover:bg-cyan-500"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-gradient-to-tr from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-full shadow-[0_8px_30px_rgba(99,102,241,0.3)] cursor-pointer flex items-center justify-center border border-white/20"
      >
        <Bot className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-12 scale-110" : ""}`} />
      </motion.button>
    </div>
  );
}
