"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { TripService } from "../../lib/db";
import { Cpu } from "lucide-react";

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
  setLocalSession: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);

  // Synchronize Supabase authentication state & local storage backup
  useEffect(() => {
    const checkLocalSession = () => {
      if (typeof window === "undefined") return false;
      const localUserStr = localStorage.getItem("smartcity_local_user");
      if (localUserStr) {
        try {
          const localUser = JSON.parse(localUserStr);
          if (localUser && localUser.email) {
            setUser(localUser);
            loadSavedItineraries(localUser.email);
            // Ensure cookie matches
            document.cookie = `sb-access-token=mock-token-${localUser.email}; path=/; max-age=604800; SameSite=Lax; Secure`;
            return true;
          }
        } catch (e) {
          console.error("Failed to parse local user session:", e);
        }
      }
      return false;
    };

    if (supabase && supabase.auth) {
      // Check current active session on load
      supabase.auth.getSession().then(({ data: { session } }: any) => {
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
        } else {
          checkLocalSession();
        }
      }).catch((err: any) => {
        console.warn("Supabase session fetch failed, trying local session:", err);
        checkLocalSession();
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
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
          const isLocal = checkLocalSession();
          if (!isLocal) {
            setUser(null);
            setSavedItineraries([]);
            document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      checkLocalSession();
    }
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
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut error:", e);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("smartcity_local_user");
      document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
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

  const setLocalSession = (localUser: User) => {
    setUser(localUser);
    loadSavedItineraries(localUser.email);
    if (typeof window !== "undefined") {
      localStorage.setItem("smartcity_local_user", JSON.stringify(localUser));
      document.cookie = `sb-access-token=mock-token-${localUser.email}; path=/; max-age=604800; SameSite=Lax; Secure`;
    }
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
        setLocalSession,
      }}
    >
      {children}

      {/* Beautiful Supabase Login Modal fallback */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#070A13]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-100">Sign in to SmartCity Tourism</h3>
              <p className="text-xs text-gray-400 text-center">
                Securely sign in to your SmartCity Tourism AI Platform to manage and save travel itineraries.
              </p>
            </div>

            {/* Email Authentication Action */}
            <div className="space-y-3">
              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-sm font-bold text-white transition-all duration-300 shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                Authenticate with Email
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
