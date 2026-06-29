"use client";

import React from "react";
import { Cpu, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full px-8 py-6 bg-white/70 dark:bg-slate-950/45 border-t border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-gray-400 z-10 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-cyan-400" />
        <span>&copy; {new Date().getFullYear()} WanderWise AI Mega-Tourism Ecosystem. All rights reserved.</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>FastAPI Live Gateway</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SSL Session Secured</span>
        </div>
      </div>
    </footer>
  );
}
