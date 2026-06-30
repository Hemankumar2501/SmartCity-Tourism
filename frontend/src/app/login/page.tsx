"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Safe check if client is initialized with valid credentials
      if (!supabase || !supabase.auth) {
        throw new Error("Supabase auth client is not initialized. Please configure valid environment credentials.");
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Handle common API key errors gracefully
        if (authError.message?.toLowerCase().includes("api key") || (authError as any).status === 401) {
          setError("SmartCity Platform connection failed: The database API key configuration is incorrect. Falling back to offline operations.");
        } else {
          setError(authError.message || "Invalid credentials.");
        }
      } else {
        // Sync active token to cookies immediately for middleware
        if (data.session) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
        }
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.error("[Login] Authentication exception captured:", err);
      setError(err.message || "Authentication system is offline. Please verify database connectivity settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      if (!supabase || !supabase.auth) {
        throw new Error("Supabase auth client is not initialized.");
      }
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      console.error("[Login] Google Auth exception captured:", err);
      setError("Google authentication service is currently unavailable. Check platform API key configurations.");
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden bg-[#070A13] px-6 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white/5 dark:bg-slate-900/45 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6 text-gray-100"
      >
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto border border-white/10">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            SmartCity Tourism
          </h2>
          <p className="text-xs text-gray-400">
            Next-Gen AI Travel Engine
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In with Email</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative z-10 px-3 bg-[#070A13] text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        {/* Social Authentication */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm font-bold text-gray-200 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Bottom Link */}
        <div className="text-center text-xs text-gray-400">
          <span>Don't have an account? </span>
          <Link href="/signup" className="text-cyan-400 font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
