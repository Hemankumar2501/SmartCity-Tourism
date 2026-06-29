"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { Sun, Moon, Laptop, Palette, X, Heart, User, Users } from "lucide-react";

export default function ThemeSelectorFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    theme, setTheme, themeClasses,
    mode, setMode 
  } = useTheme();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close panel on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const modes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "system", icon: Laptop, label: "System" },
  ];

  const travelThemes = [
    { 
      name: "solo", 
      icon: User, 
      label: "Solo Vibe", 
      desc: "Sharp & Minimalist", 
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" 
    },
    { 
      name: "couple", 
      icon: Heart, 
      label: "Couple Vibe", 
      desc: "Romantic & Rounded", 
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20" 
    },
    { 
      name: "team", 
      icon: Users, 
      label: "Team Vibe", 
      desc: "Bold & Energetic", 
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20" 
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" ref={menuRef}>
      {/* Settings Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`mb-4 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-5 text-slate-800 dark:text-gray-100 flex flex-col gap-5`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                <span className="font-extrabold text-sm tracking-tight">Theme Architect</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Travel Vibe Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">
                Travel Layout Vibe
              </label>
              <div className="flex flex-col gap-2">
                {travelThemes.map((vibe) => {
                  const Icon = vibe.icon;
                  const isSelected = theme === vibe.name;
                  return (
                    <button
                      key={vibe.name}
                      onClick={() => setTheme(vibe.name as any)}
                      className={`flex items-center gap-3 w-full p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? `${vibe.color} shadow-sm font-bold`
                          : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-300"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg border ${isSelected ? "bg-white dark:bg-slate-950 border-current" : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <span className="text-xs block font-bold">{vibe.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500 block">{vibe.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Mode Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">
                Color Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                {modes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = mode === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setMode(item.name)}
                      title={item.label}
                      className={`py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-full shadow-[0_8px_30px_rgb(99,102,241,0.3)] cursor-pointer flex items-center justify-center transition-all duration-300 relative border border-white/20`}
      >
        <Palette className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </motion.button>
    </div>
  );
}
