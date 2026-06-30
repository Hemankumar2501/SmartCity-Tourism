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
