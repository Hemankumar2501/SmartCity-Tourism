import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      if (!supabase || !supabase.auth) {
        throw new Error("Supabase client is not initialized.");
      }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Error exchanging code for session:", error.message);
        return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
      }

      if (data?.session) {
        const response = NextResponse.redirect(new URL("/dashboard", request.url));
        response.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          maxAge: 604800,
          sameSite: "lax",
          secure: true,
        });
        return response;
      }
    } catch (err) {
      console.error("Exception in auth callback route:", err);
    }
  }

  // Redirect to login if something goes wrong or no code
  return NextResponse.redirect(new URL("/login", request.url));
}
