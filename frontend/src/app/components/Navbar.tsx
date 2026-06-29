"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { Cpu, LogOut, Heart, Users, User, Compass, Map, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, login, logout } = useAuth();
  const { theme, setTheme, themeClasses } = useTheme();

  const navLinks = [
    { name: "Home", href: "/", icon: Compass },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Interactive Map", href: "/map", icon: Map },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-4 bg-slate-950/45 border-b border-white/10 backdrop-blur-xl flex items-center justify-between shadow-lg">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            WanderWise AI
          </h1>
          <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-semibold">
            Mega-Tourism Hub
          </span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-white/10 text-cyan-300 shadow-inner"
                  : "text-gray-400 hover:text-cyan-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Theme Toggles & Authentication */}
      <div className="flex items-center gap-4">
        {/* Floating ThemeSwitcher */}
        <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setTheme("solo")}
            title="Solo Theme"
            className={`p-1.5 rounded text-xs font-bold transition-all duration-200 cursor-pointer ${
              theme === "solo" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <User className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme("couple")}
            title="Couple Theme"
            className={`p-1.5 rounded text-xs font-bold transition-all duration-200 cursor-pointer ${
              theme === "couple" ? "bg-purple-500/20 text-purple-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme("team")}
            title="Team Theme"
            className={`p-1.5 rounded text-xs font-bold transition-all duration-200 cursor-pointer ${
              theme === "team" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Session Info / Google Login button */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1.5 pr-3 rounded-lg border border-white/5">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20"
              />
              <span className="text-[10px] font-bold text-gray-200 max-w-[80px] truncate">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 cursor-pointer transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className={`px-4 py-2 text-xs font-bold transition-all duration-300 cursor-pointer ${themeClasses.btn}`}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
