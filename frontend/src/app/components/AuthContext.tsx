"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { TripService } from "../../lib/db";

interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface SavedItinerary {
  id: string;
  savedAt: string;
  destinations: string[];
  duration_days: number;
  total_estimated_cost: number;
  itinerary: any[];
  recommendations: string[];
  budget_breakdown?: any;
  packing_list?: string[];
  model_version: string;
}

interface AuthContextType {
  user: User | null;
  showLoginModal: boolean;
  savedItineraries: SavedItinerary[];
  setShowLoginModal: (show: boolean) => void;
  login: () => void;
  logout: () => void;
  saveItinerary: (itinerary: Omit<SavedItinerary, "id" | "savedAt"> & { id?: string }) => Promise<boolean>;
  deleteItinerary: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);

  // Synchronize Supabase authentication state
  useEffect(() => {
    if (!supabase || !supabase.auth) return;

    // Check current active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || "anonymous@skygrid.io";
        const name = session.user.user_metadata?.full_name || email.split("@")[0] || "Smart Tourist";
        setUser({
          name,
          email,
          avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        });
        loadSavedItineraries(email);
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const email = session.user.email || "anonymous@skygrid.io";
        const name = session.user.user_metadata?.full_name || email.split("@")[0] || "Smart Tourist";
        setUser({
          name,
          email,
          avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        });
        loadSavedItineraries(email);
        setShowLoginModal(false);
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
      } else {
        setUser(null);
        setSavedItineraries([]);
        document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSavedItineraries = async (email: string) => {
    const trips = await TripService.getUserTrips(email);
    setSavedItineraries(trips);
  };

  const login = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const logout = async () => {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const saveItinerary = async (itinerary: Omit<SavedItinerary, "id" | "savedAt"> & { id?: string }): Promise<boolean> => {
    if (!user) {
      setShowLoginModal(true);
      return false;
    }

    await TripService.saveTrip({
      ...itinerary,
      email: user.email,
    });

    await loadSavedItineraries(user.email);
    return true;
  };

  const deleteItinerary = async (id: string) => {
    if (!user) return;
    await TripService.deleteTrip(id, user.email);
    await loadSavedItineraries(user.email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        showLoginModal,
        savedItineraries,
        setShowLoginModal,
        login,
        logout,
        saveItinerary,
        deleteItinerary,
      }}
    >
      {children}

      {/* Beautiful Supabase Login Modal fallback */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#070A13]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-100">Sign in to SmartCity Tourism</h3>
              <p className="text-xs text-gray-400 text-center">
                Securely sign in to your SmartCity Tourism AI Platform to manage and save travel itineraries.
              </p>
            </div>

            {/* Google Authentication Action */}
            <div className="space-y-3">
              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-sm font-bold text-white transition-all duration-300 shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                Authenticate with Email / Google
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
