import { SavedItinerary } from "../app/components/AuthContext";

// Key prefixes for localStorage storage fallback
const LOCAL_STORAGE_TRIP_PREFIX = "wanderwise_trip_";
const LOCAL_STORAGE_USER_INDEX_PREFIX = "wanderwise_user_trips_";

/**
 * TripService - Database abstraction layer for managing itineraries.
 * 
 * Production Integration Note:
 * To migrate from localStorage to a production database (e.g., Supabase, Firebase, or Prisma):
 * 1. Replace the localStorage read/write logic inside these methods with your ORM / API calls.
 * 2. Example Supabase client integration:
 *    import { supabase } from './supabaseClient';
 *    ...
 *    const { data, error } = await supabase.from('trips').insert([trip]);
 */
export const TripService = {
  /**
   * Saves or updates a travel itinerary.
   * If no ID exists, a cryptographically secure UUID is assigned automatically.
   */
  async saveTrip(trip: Omit<SavedItinerary, "id" | "savedAt"> & { id?: string; email?: string }): Promise<SavedItinerary> {
    const tripId = trip.id || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
      
    const savedAt = new Date().toISOString();
    const savedTrip: SavedItinerary = {
      ...trip,
      id: tripId,
      savedAt,
    };

    if (typeof window !== "undefined") {
      // Fallback: Save to client-side localStorage
      localStorage.setItem(`${LOCAL_STORAGE_TRIP_PREFIX}${tripId}`, JSON.stringify(savedTrip));

      // Index the trip ID under the user's email or 'anonymous'
      const emailKey = trip.email || "anonymous";
      const userIndexKey = `${LOCAL_STORAGE_USER_INDEX_PREFIX}${emailKey}`;
      const existingIndex = localStorage.getItem(userIndexKey);
      
      let ids: string[] = existingIndex ? JSON.parse(existingIndex) : [];
      if (!ids.includes(tripId)) {
        ids.unshift(tripId); // Put newest trip first
        localStorage.setItem(userIndexKey, JSON.stringify(ids));
      }
    } else {
      console.warn("[TripService] saveTrip: Running on server. Data was not persisted to localStorage.");
    }

    return savedTrip;
  },

  /**
   * Retrieves all saved travel plans for a specific user email.
   * Includes legacy migration of old-format user trips.
   */
  async getUserTrips(email: string): Promise<SavedItinerary[]> {
    if (typeof window === "undefined") {
      return [];
    }

    const emailKey = email || "anonymous";
    const userIndexKey = `${LOCAL_STORAGE_USER_INDEX_PREFIX}${emailKey}`;
    const existingIndex = localStorage.getItem(userIndexKey);

    if (!existingIndex) {
      // Check and migrate from legacy key format: `saved_itineraries_${email}`
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

      // Sort by save date descending
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
    if (typeof window === "undefined") {
      return false;
    }

    // Remove the trip data
    localStorage.removeItem(`${LOCAL_STORAGE_TRIP_PREFIX}${id}`);

    // Update the index list
    const emailKey = email || "anonymous";
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
  }
};
