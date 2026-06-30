import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("sb-access-token");
  const { pathname } = request.nextUrl;

  // Exempt auth callback route from authentication checks
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // Redirect to dashboard if already logged in and trying to access login or signup
  if (token && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Bypass checks for assets, logins, API requests
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/trip/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Redirect to login if no auth token cookie is found
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all matching paths
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
