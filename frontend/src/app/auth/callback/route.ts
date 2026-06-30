import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Auth Callback] Code exchange failed:", error.message);
        return NextResponse.redirect(
          new URL("/login?error=exchange_failed", request.url)
        );
      }
    } catch (err) {
      console.error("[Auth Callback] Exception during code exchange:", err);
      return NextResponse.redirect(
        new URL("/login?error=callback_exception", request.url)
      );
    }
  }

  // Redirect to dashboard on success (or if no code was provided)
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
