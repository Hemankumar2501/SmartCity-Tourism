import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = request.nextUrl;

  // CRITICAL: Allow the auth callback route to pass through unconditionally.
  // Blocking this route prevents the OAuth code exchange from completing.
  if (pathname.startsWith("/auth/callback")) {
    return res;
  }

  // Allow public assets and API routes through without session checks
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/trip/") ||
    pathname === "/favicon.ico"
  ) {
    return res;
  }

  // Create a Supabase client that reads/writes cookies on the request/response pair
  const supabase = createMiddlewareClient({ req: request, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If the user has a session and is trying to access login/signup, redirect to dashboard
  if (session && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If no session and the route is not the login or signup page, redirect to login
  if (!session && pathname !== "/login" && pathname !== "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
