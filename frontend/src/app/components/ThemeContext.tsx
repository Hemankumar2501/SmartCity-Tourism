"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export type TravelTheme = "solo" | "couple" | "team";

interface ThemeClasses {
  rounded: string;
  border: string;
  text: string;
  btn: string;
  font: string;
  bg: string;
  badge: string;
}

interface TravelThemeContextType {
  travelTheme: TravelTheme;
  setTravelTheme: (theme: TravelTheme) => void;
  themeClasses: ThemeClasses;
}

const TravelThemeContext = createContext<TravelThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [travelTheme, setTravelThemeState] = useState<TravelTheme>("solo");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("travel-theme") as TravelTheme;
    if (saved === "solo" || saved === "couple" || saved === "team") {
      setTravelThemeState(saved);
    }
  }, []);

  const setTravelTheme = (newTheme: TravelTheme) => {
    setTravelThemeState(newTheme);
    localStorage.setItem("travel-theme", newTheme);
  };

  const themeClasses: ThemeClasses = {
    solo: {
      rounded: "rounded-none",
      border: "border-cyan-500/20 dark:border-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
      btn: "bg-cyan-600 hover:bg-cyan-500 text-white rounded-none shadow-[0_4px_15px_rgba(6,182,212,0.15)]",
      font: "font-sans",
      bg: "from-cyan-100/50 via-slate-100/30 to-slate-200/50 dark:from-cyan-950/20 dark:via-slate-900/10 dark:to-slate-950/40",
      badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
    },
    couple: {
      rounded: "rounded-3xl",
      border: "border-purple-500/20 dark:border-purple-500/10",
      text: "text-purple-600 dark:text-purple-300",
      btn: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-3xl shadow-[0_4px_15px_rgba(168,85,247,0.15)]",
      font: "font-sans font-medium tracking-normal",
      bg: "from-purple-100/50 via-slate-100/30 to-slate-200/50 dark:from-purple-950/20 dark:via-slate-900/10 dark:to-slate-950/40",
      badge: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
    },
    team: {
      rounded: "rounded-lg border-2 border-amber-500/40 dark:border-amber-500/30 shadow-[4px_4px_0px_rgba(245,158,11,0.3)]",
      border: "border-amber-500/30 dark:border-amber-500/25",
      text: "text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider",
      btn: "bg-amber-600 hover:bg-amber-500 text-white rounded-md uppercase font-bold tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100",
      font: "font-mono uppercase tracking-wide",
      bg: "from-amber-100/50 via-slate-100/30 to-slate-200/50 dark:from-amber-950/20 dark:via-slate-900/10 dark:to-slate-950/40",
      badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
    }
  }[travelTheme];

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <TravelThemeContext.Provider value={{ travelTheme, setTravelTheme, themeClasses }}>
        <div className={`transition-all duration-300 ${mounted ? themeClasses.font : ""}`}>
          {children}
        </div>
      </TravelThemeContext.Provider>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(TravelThemeContext);
  const nextTheme = useNextTheme();

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return {
    // Custom travel theme context variables
    theme: context.travelTheme, 
    setTheme: context.setTravelTheme,
    travelTheme: context.travelTheme,
    setTravelTheme: context.setTravelTheme,
    themeClasses: context.themeClasses,

    // next-themes light/dark variables
    mode: nextTheme.theme,
    setMode: nextTheme.setTheme,
    resolvedMode: nextTheme.resolvedTheme,
    systemTheme: nextTheme.systemTheme,
  };
}
