import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // 1. CHECK FOR OAUTH AUTHENTICATION CODE IN QUERY PARAMS
  // If the request contains a 'code' parameter, bypass the auth guard to let the callback route handle it
  if (request.nextUrl.searchParams.has("code")) {
    return response;
  }

  // Exempt auth callback route from authentication checks
  if (pathname.startsWith("/auth/callback")) {
    return response;
  }

  // Allow public assets and API routes through without session checks
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/trip/") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // 2. ALIGN COOKIE PARSING SCHEME
  // Read the local verification token (sb-access-token)
  const localToken = request.cookies.get("sb-access-token")?.value;

  // Create a Supabase client that reads/writes cookies on the request/response pair
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Combine checks: consider user authenticated if a Supabase SSR session exists OR a local token is present
  const isUserAuthenticated = !!session || !!localToken;

  // If the user is authenticated and is trying to access login/signup, redirect to dashboard
  if (isUserAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If not authenticated and the route is not the login or signup page, redirect to login
  if (!isUserAuthenticated && pathname !== "/login" && pathname !== "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
