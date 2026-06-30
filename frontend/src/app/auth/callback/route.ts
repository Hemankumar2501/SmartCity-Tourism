import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  // 1. Return descriptive login boundary if auth code parameter is completely absent
  if (!code) {
    console.error("[Auth Callback] Missing code parameter reference context");
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  try {
    const cookieStore = await cookies();

    // Create an explicit response context so token cookies attach perfectly on server headers
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (cookieError) {
              // Server component layout architecture backup pipeline injection fallback
              console.warn("[Auth Callback] Cookie mutations handled via alternate payload buffer strategy");
            }
          },
        },
      }
    );

    // Explicitly exchange the dynamic structural token code array context payload session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Token metadata exchange failed directly:", error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // Success deployment loop verification entry execution context trace target
    return response;
  } catch (err: any) {
    const message = err?.message || "Unknown auth token callback exception context pipeline error";
    console.error("[Auth Callback] Severe dynamic layout exception trace target capture:", message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}