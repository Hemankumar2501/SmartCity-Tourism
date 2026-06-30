import { SavedItinerary } from "../app/components/AuthContext";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface MemoryItem {
  id: string;
  savedAt: string;
  imageUrl: string;
  caption: string;
  email: string;
}

// Key prefixes for localStorage storage fallback
const LOCAL_STORAGE_TRIP_PREFIX = "smartcity_trip_";
const LOCAL_STORAGE_USER_INDEX_PREFIX = "smartcity_user_trips_";

export const TripService = {
  /**
   * Helper to write to local storage index for local caching.
   */
  cacheLocally(trip: SavedItinerary, email?: string) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${LOCAL_STORAGE_TRIP_PREFIX}${trip.id}`, JSON.stringify(trip));

      const emailKey = email || "anonymous";
      const userIndexKey = `${LOCAL_STORAGE_USER_INDEX_PREFIX}${emailKey}`;
      const existingIndex = localStorage.getItem(userIndexKey);
      
      let ids: string[] = existingIndex ? JSON.parse(existingIndex) : [];
      if (!ids.includes(trip.id)) {
        ids.unshift(trip.id);
        localStorage.setItem(userIndexKey, JSON.stringify(ids));
      }
    } catch (err) {
      console.error("[TripService] Local caching failed:", err);
    }
  },

  /**
   * Saves or updates a travel itinerary.
   * Syncs with Supabase if credentials exist, falling back to local storage on failure or lack of configuration.
   */
  async saveTrip(
    trip: Omit<SavedItinerary, "id" | "savedAt"> & { id?: string; email?: string }
  ): Promise<SavedItinerary> {
    const tripId =
      trip.id ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15));

    const savedAt = new Date().toISOString();
    const savedTrip: SavedItinerary = {
      ...trip,
      id: tripId,
      savedAt,
    };

    if (isSupabaseConfigured()) {
      try {
        console.log(`[Supabase] Upserting trip ID ${tripId} for user ${trip.email || "anonymous"}`);
        const { error } = await supabase.from("trips").upsert({
          id: tripId,
          saved_at: savedAt,
          destinations: trip.destinations,
          duration_days: trip.duration_days,
          total_estimated_cost: trip.total_estimated_cost,
          itinerary: trip.itinerary,
          recommendations: trip.recommendations,
          budget_breakdown: trip.budget_breakdown,
          packing_list: trip.packing_list,
          email: trip.email || "anonymous",
          model_version: trip.model_version,
        });

        if (error) {
          console.warn("[Supabase] Database upsert returned error, falling back to localStorage:", error.message);
        } else {
          console.log("[Supabase] Saved trip successfully.");
          this.cacheLocally(savedTrip, trip.email);
          return savedTrip;
        }
      } catch (err: any) {
        console.error("[Supabase] Exception encountered during save operation, applying localStorage fallback:", err.message || err);
      }
    }

    // Local Storage Fallback
    if (typeof window !== "undefined") {
      this.cacheLocally(savedTrip, trip.email);
    } else {
      console.warn("[TripService] saveTrip: Running on server. Data was not persisted to localStorage.");
    }

    return savedTrip;
  },

  /**
   * Retrieves all saved travel plans for a specific user email.
   * Attempts Supabase fetching and falls back to client localStorage index list.
   */
  async getUserTrips(email: string): Promise<SavedItinerary[]> {
    const emailKey = email || "anonymous";

    if (isSupabaseConfigured()) {
      try {
        console.log(`[Supabase] Fetching trips index for email: ${emailKey}`);
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("email", emailKey)
          .order("saved_at", { ascending: false });

        if (error) {
          console.warn("[Supabase] Failed to fetch trips, reverting to local caching list:", error.message);
        } else if (data) {
          // Normalize DB response to local model
          const normalized: SavedItinerary[] = data.map((d: any) => ({
            id: d.id,
            savedAt: d.saved_at || d.savedAt,
            destinations: d.destinations,
            duration_days: d.duration_days,
            total_estimated_cost: d.total_estimated_cost,
            itinerary: d.itinerary,
            recommendations: d.recommendations,
            budget_breakdown: d.budget_breakdown,
            packing_list: d.packing_list,
            model_version: d.model_version,
          }));

          // Synchronize local cache with latest DB data
          if (typeof window !== "undefined") {
            normalized.forEach((trip) => this.cacheLocally(trip, emailKey));
          }
          return normalized;
        }
      } catch (err: any) {
        console.error("[Supabase] getUserTrips failed, using local caching:", err.message || err);
      }
    }

    // Local Storage fallback & migration support
    if (typeof window === "undefined") {
      return [];
    }

    const userIndexKey = `${LOCAL_STORAGE_USER_INDEX_PREFIX}${emailKey}`;
    const existingIndex = localStorage.getItem(userIndexKey);

    if (!existingIndex) {
      // Check legacy format
      const legacyKey = `saved_itineraries_${email}`;
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          const trips: SavedItinerary[] = JSON.parse(legacyData);
          const migratedIds: string[] = [];

          for (const trip of trips) {
            const tripId = trip.id || Math.random().toString(36).substring(2, 9);
            const formattedTrip = { ...trip, id: tripId };
            localStorage.setItem(`${LOCAL_STORAGE_TRIP_PREFIX}${tripId}`, JSON.stringify(formattedTrip));
            migratedIds.push(tripId);
          }

          localStorage.setItem(userIndexKey, JSON.stringify(migratedIds));
          return trips;
        } catch (err) {
          console.error("[TripService] Legacy itineraries migration failed:", err);
        }
      }
      return [];
    }

    try {
      const ids: string[] = JSON.parse(existingIndex);
      const trips: SavedItinerary[] = [];

      for (const id of ids) {
        const item = localStorage.getItem(`${LOCAL_STORAGE_TRIP_PREFIX}${id}`);
        if (item) {
          trips.push(JSON.parse(item));
        }
      }

      return trips.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } catch (err) {
      console.error("[TripService] Error loading user trips:", err);
      return [];
    }
  },

  /**
   * Fetches a single itinerary by its unique UUID.
   */
  async getTripById(id: string): Promise<SavedItinerary | null> {
    if (isSupabaseConfigured()) {
      try {
        console.log(`[Supabase] Fetching trip ID: ${id}`);
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.warn(`[Supabase] Fetching trip by ID failed, falling back to local storage:`, error.message);
        } else if (data) {
          return {
            id: data.id,
            savedAt: data.saved_at || data.savedAt,
            destinations: data.destinations,
            duration_days: data.duration_days,
            total_estimated_cost: data.total_estimated_cost,
            itinerary: data.itinerary,
            recommendations: data.recommendations,
            budget_breakdown: data.budget_breakdown,
            packing_list: data.packing_list,
            model_version: data.model_version,
          };
        }
      } catch (err: any) {
        console.error(`[Supabase] getTripById exception for trip ${id}:`, err.message || err);
      }
    }

    // Local Storage fallback
    if (typeof window === "undefined") {
      return null;
    }

    const item = localStorage.getItem(`${LOCAL_STORAGE_TRIP_PREFIX}${id}`);
    if (!item) return null;

    try {
      return JSON.parse(item);
    } catch (err) {
      console.error(`[TripService] Error loading trip by id (${id}):`, err);
      return null;
    }
  },

  /**
   * Deletes an itinerary by ID and removes it from the user's index list.
   */
  async deleteTrip(id: string, email: string): Promise<boolean> {
    const emailKey = email || "anonymous";

    if (isSupabaseConfigured()) {
      try {
        console.log(`[Supabase] Deleting trip ID ${id} for email ${emailKey}`);
        const { error } = await supabase
          .from("trips")
          .delete()
          .eq("id", id)
          .eq("email", emailKey);

        if (error) {
          console.warn("[Supabase] Failed to delete from cloud database, applying local cache removal:", error.message);
        } else {
          console.log("[Supabase] Deleted from cloud database successfully.");
        }
      } catch (err: any) {
        console.error("[Supabase] deleteTrip exception, applying local cache removal:", err.message || err);
      }
    }

    if (typeof window === "undefined") {
      return false;
    }

    // Remove local cache
    localStorage.removeItem(`${LOCAL_STORAGE_TRIP_PREFIX}${id}`);

    // Update index list
    const userIndexKey = `${LOCAL_STORAGE_USER_INDEX_PREFIX}${emailKey}`;
    const existingIndex = localStorage.getItem(userIndexKey);

    if (existingIndex) {
      try {
        let ids: string[] = JSON.parse(existingIndex);
        ids = ids.filter((currId) => currId !== id);
        localStorage.setItem(userIndexKey, JSON.stringify(ids));
      } catch (err) {
        console.error("[TripService] Error updating user index during deletion:", err);
      }
    }

    return true;
  },

  /**
   * Saves a travel memory Polaroid.
   */
  async saveMemory(memory: Omit<MemoryItem, "id" | "savedAt"> & { id?: string; email?: string }): Promise<MemoryItem> {
    const memId = memory.id || Math.random().toString(36).substring(2, 15);
    const savedAt = new Date().toISOString();
    const savedMemory: MemoryItem = {
      id: memId,
      savedAt,
      imageUrl: memory.imageUrl,
      caption: memory.caption,
      email: memory.email || "anonymous"
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("memories").upsert({
          id: memId,
          saved_at: savedAt,
          image_url: memory.imageUrl,
          caption: memory.caption,
          email: memory.email || "anonymous"
        });

        if (error) {
          console.warn("[Supabase] Failed to save memory, falling back to localStorage:", error.message);
        } else {
          console.log("[Supabase] Memory saved successfully.");
          this.cacheMemoryLocally(savedMemory);
          return savedMemory;
        }
      } catch (err: any) {
        console.error("[Supabase] Exception saving memory, falling back to localStorage:", err.message || err);
      }
    }

    this.cacheMemoryLocally(savedMemory);
    return savedMemory;
  },

  cacheMemoryLocally(memory: MemoryItem) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`smartcity_memory_${memory.id}`, JSON.stringify(memory));
      const userMemoriesKey = `smartcity_user_memories_${memory.email}`;
      const index = localStorage.getItem(userMemoriesKey);
      let ids: string[] = index ? JSON.parse(index) : [];
      if (!ids.includes(memory.id)) {
        ids.unshift(memory.id);
        localStorage.setItem(userMemoriesKey, JSON.stringify(ids));
      }
    } catch (err) {
      console.error("[TripService] Local memory cache failed:", err);
    }
  },

  /**
   * Retrieves all travel memories for a user.
   */
  async getUserMemories(email: string): Promise<MemoryItem[]> {
    const emailKey = email || "anonymous";

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("memories")
          .select("*")
          .eq("email", emailKey)
          .order("saved_at", { ascending: false });

        if (error) {
          console.warn("[Supabase] Failed to fetch memories, falling back to localStorage:", error.message);
        } else if (data) {
          const normalized: MemoryItem[] = data.map((d: any) => ({
            id: d.id,
            savedAt: d.saved_at || d.savedAt,
            imageUrl: d.image_url || d.imageUrl,
            caption: d.caption,
            email: d.email,
          }));

          if (typeof window !== "undefined") {
            normalized.forEach((mem) => this.cacheMemoryLocally(mem));
          }
          return normalized;
        }
      } catch (err: any) {
        console.error("[Supabase] getUserMemories failed, using local storage:", err.message || err);
      }
    }

    if (typeof window === "undefined") return [];

    const userMemoriesKey = `smartcity_user_memories_${emailKey}`;
    const index = localStorage.getItem(userMemoriesKey);
    if (!index) return [];

    try {
      const ids: string[] = JSON.parse(index);
      const memories: MemoryItem[] = [];
      for (const id of ids) {
        const item = localStorage.getItem(`smartcity_memory_${id}`);
        if (item) {
          memories.push(JSON.parse(item));
        }
      }
      return memories;
    } catch (err) {
      console.error("[TripService] Error loading user memories:", err);
      return [];
    }
  },

  /**
   * Deletes a travel memory.
   */
  async deleteMemory(id: string, email: string): Promise<boolean> {
    const emailKey = email || "anonymous";

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("memories")
          .delete()
          .eq("id", id)
          .eq("email", emailKey);

        if (error) {
          console.warn("[Supabase] Failed to delete memory from DB, falling back to local cache:", error.message);
        }
      } catch (err: any) {
        console.error("[Supabase] deleteMemory exception, applying local cache removal:", err.message || err);
      }
    }

    if (typeof window === "undefined") return false;

    localStorage.removeItem(`smartcity_memory_${id}`);
    const userMemoriesKey = `smartcity_user_memories_${emailKey}`;
    const index = localStorage.getItem(userMemoriesKey);
    if (index) {
      try {
        let ids: string[] = JSON.parse(index);
        ids = ids.filter((currId) => currId !== id);
        localStorage.setItem(userMemoriesKey, JSON.stringify(ids));
      } catch (err) {
        console.error("[TripService] Error updating memories index during deletion:", err);
      }
    }

    return true;
  }
};
