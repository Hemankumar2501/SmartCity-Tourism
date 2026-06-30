import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return (
    url.startsWith("https://") &&
    key.length > 20 &&
    !url.includes("ungaloda") &&
    !key.includes("ungaloda")
  );
}



let supabaseInstance: any = null;

if (!isSupabaseConfigured()) {
  console.error(
    "[Supabase Config Missing] Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined or using template keys. Client will not be initialized."
  );
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

// Connection test helper with console logs for debugging
async function testSupabaseConnection() {
  if (!supabase) return;
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
