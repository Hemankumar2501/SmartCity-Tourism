import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. STRICT BYPASS INTERCEPTOR BLOCK
  // If path starts with /auth, contains a code parameter, or is a public/static asset, bypass instantly
  if (
    pathname.startsWith("/auth") ||
    searchParams.has("code") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/trip/") ||
    pathname === "/signup" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  // 2. ALIGN COOKIE PARSING SCHEME
  const localToken = request.cookies.get("sb-access-token")?.value;

  // Combine checks: consider user authenticated if a local token is present from cookie sync
  let isUserAuthenticated = !!localToken;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasValidEnv = supabaseUrl && 
                       supabaseAnonKey && 
                       supabaseUrl !== "undefined" && 
                       supabaseAnonKey !== "undefined" &&
                       supabaseUrl.trim() !== "" &&
                       supabaseAnonKey.trim() !== "";

  if (hasValidEnv) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // Set cookies on the request (for downstream server components)
              cookiesToSet.forEach(({ name, value }) => {
                request.cookies.set(name, value);
              });
              // Clone the response and set cookies on it (for the browser)
              response = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Consider user authenticated if session exists or local token is present
      isUserAuthenticated = !!session || !!localToken;
    } catch (e) {
      console.error("[Middleware] Supabase client initialization or session resolution failed:", e);
    }
  } else {
    console.warn("[Middleware] Supabase environment variables are missing. Using local token synchronization check.");
  }

  // If the user is authenticated and is trying to access login, redirect to dashboard
  if (isUserAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If not authenticated and the route is not the login page, redirect to login
  if (!isUserAuthenticated && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
