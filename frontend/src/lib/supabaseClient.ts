import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Suppressing database queries and falling back to localStorage."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://dummy-url.supabase.co",
  supabaseAnonKey || "dummy-anon-key",
  {
    auth: {
      persistSession: false,
    },
  }
);

// Connection test helper with console logs for debugging
async function testSupabaseConnection() {
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("id")
      .limit(1);

    if (error) {
      console.error(
        `[Supabase] Database health check returned an error. Table 'trips' might not exist or permissions are invalid:`,
        error.message
      );
    } else {
      console.log("[Supabase] Database connectivity check succeeded. Trips query test passed.");
    }
  } catch (err: any) {
    console.error(
      "[Supabase] Connection test encountered an exception. Check your endpoint URL:",
      err.message || err
    );
  }
}

// Self-execute on module load
if (typeof window !== "undefined") {
  testSupabaseConnection();
}
