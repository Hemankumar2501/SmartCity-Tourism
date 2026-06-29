"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Theme = "solo" | "couple" | "team";

interface ThemeClasses {
  rounded: string;
  border: string;
  text: string;
  btn: string;
  font: string;
  bg: string;
  badge: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeClasses: ThemeClasses;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("solo");

  useEffect(() => {
    const saved = localStorage.getItem("travel-theme") as Theme;
    if (saved === "solo" || saved === "couple" || saved === "team") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("travel-theme", newTheme);
  };

  const themeClasses: ThemeClasses = {
    solo: {
      rounded: "rounded-none",
      border: "border-cyan-500/20",
      text: "text-cyan-400",
      btn: "bg-cyan-600 hover:bg-cyan-500 text-white rounded-none shadow-[0_4px_15px_rgba(6,182,212,0.15)]",
      font: "font-sans",
      bg: "from-cyan-950/20 via-slate-900/10 to-slate-950/40",
      badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    },
    couple: {
      rounded: "rounded-3xl",
      border: "border-purple-500/20",
      text: "text-purple-300",
      btn: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-3xl shadow-[0_4px_15px_rgba(168,85,247,0.15)]",
      font: "font-sans font-medium tracking-normal",
      bg: "from-purple-950/20 via-slate-900/10 to-slate-950/40",
      badge: "bg-purple-500/10 text-purple-300 border-purple-500/20"
    },
    team: {
      rounded: "rounded-md",
      border: "border-amber-500/25",
      text: "text-amber-400 font-bold uppercase tracking-wider",
      btn: "bg-amber-600 hover:bg-amber-500 text-white rounded-md uppercase font-bold tracking-widest shadow-[0_4px_15px_rgba(245,158,11,0.15)]",
      font: "font-mono uppercase tracking-wide",
      bg: "from-amber-950/20 via-slate-900/10 to-slate-950/40",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/25"
    }
  }[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme: toggleTheme, themeClasses }}>
      <div className={`transition-all duration-300 ${themeClasses.font}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
